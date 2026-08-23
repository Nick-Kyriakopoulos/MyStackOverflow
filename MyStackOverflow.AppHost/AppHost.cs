using Aspire.Hosting.Docker.Resources.ServiceNodes;
using Microsoft.Extensions.Hosting;

#pragma warning disable ASPIRECERTIFICATES001
var builder = DistributedApplication.CreateBuilder(args);

var compose = builder.AddDockerComposeEnvironment("production")
    .WithDashboard(dashboard => dashboard.WithHostPort(8080));

var keycloak = builder.AddKeycloak("keycloak", 6001)
    .WithDataVolume("keycloak-data")
    .WithRealmImport("../infra/realms")
    .WithEnvironment("KC_HTTP_ENABLED", "true")
    .WithEnvironment("KC_HOSTNAME_STRICT", "false")
    .WithEnvironment("VIRTUAL_HOST", "id.mystackoverflow.local")
    .WithEnvironment("VIRTUAL_PORT", "8080")
    // Pins the issuer Keycloak stamps into tokens. Without it the issuer varies
    // with how Keycloak was reached (container name vs public host) and the
    // token fails validation in the API and in NextAuth.
    .WithEnvironment("KC_HOSTNAME", "https://id.mystackoverflow.local")
    .WithEnvironment("KC_PROXY_HEADERS", "xforwarded");

var postgres = builder.AddPostgres("postgres", port: 5432)
    .WithDataVolume("postgres-data")
    .WithPgAdmin();

var typesenseApiKey = builder.AddParameter("typesense-api-key", secret: true);

var typesense = builder.AddContainer("typesense", "typesense/typesense", "29.0")
    .WithVolume("typesense-data", "/data")
    .WithEnvironment("TYPESENSE_DATA_DIR", "/data")
    .WithEnvironment("TYPESENSE_ENABLE_CORS", "true")
    .WithEnvironment("TYPESENSE_API_KEY", typesenseApiKey)
    .WithHttpEndpoint(8108, 8108, name: "typesense");

var typesenseContainer = typesense.GetEndpoint("typesense");

var questionDb = postgres.AddDatabase("questionDb");

var rabbitmq = builder.AddRabbitMQ("messaging")
    .WithDataVolume("rabbitmq-data")
    .WithManagementPlugin(port: 15672);

var questionService = builder.AddProject<Projects.QuestionService>("question-svc")
    .WithReference(keycloak)
    .WithReference(questionDb)
    .WithReference(rabbitmq)
    .WaitFor(keycloak)
    .WaitFor(questionDb)
    .WaitFor(rabbitmq);


var searchService = builder.AddProject<Projects.SearchService>("search-svc")
    .WithEnvironment("typesense-api-key", typesenseApiKey)
    .WithReference(typesenseContainer)
    .WithReference(rabbitmq)
    .WaitFor(rabbitmq)
    .WaitFor(typesense);


var yarp = builder.AddYarp("gateway")
    .WithConfiguration(yarpBuilder =>
    {
        yarpBuilder.AddRoute("/questions/{**catch-all}", questionService);
        yarpBuilder.AddRoute("/test/{**catch-all}", questionService);
        yarpBuilder.AddRoute("/tags/{**catch-all}", questionService);
        yarpBuilder.AddRoute("/search/{**catch-all}", searchService);
    })
    .WithHttpEndpoint(port: 8001, targetPort: 5000)
    .WithEnvironment("VIRTUAL_HOST", "api.mystackoverflow.local")
    // The container port from WithHttpEndpoint's targetPort, not the host port
    // 8001. nginx-proxy connects over the compose network, where only 5000 is
    // listening - pointing it at 8001 answers every request with a 502.
    .WithEnvironment("VIRTUAL_PORT", "5000");

var webapp = builder.AddJavaScriptApp("webapp", "../webapp")
    .WithReference(keycloak)
    .WithHttpEndpoint(env: "PORT", port: 3000)
    // Builds webapp/Dockerfile when publishing; ignored by `aspire run`, which
    // keeps using npm dev against webapp/.env.local.
    .PublishAsDockerFile();

// Only in publish mode: declaring these parameters unconditionally would make
// `aspire run` block on values that development reads from .env.local instead.
if (builder.ExecutionContext.IsPublishMode)
{
    var authSecret = builder.AddParameter("auth-secret", secret: true);
    var keycloakClientSecret = builder.AddParameter("keycloak-client-secret", secret: true);
    var keycloakAdminClientSecret = builder.AddParameter("keycloak-admin-client-secret", secret: true);
    var cloudinaryCloudName = builder.AddParameter("cloudinary-cloud-name");
    var cloudinaryApiKey = builder.AddParameter("cloudinary-api-key", secret: true);
    var cloudinaryApiSecret = builder.AddParameter("cloudinary-api-secret", secret: true);

    webapp
        // The browser has to reach Keycloak at the same URL the server uses, or
        // the issuer in the token will not match what NextAuth validates.
        .WithEnvironment("AUTH_KEYCLOACK_ISSUER", "https://id.mystackoverflow.local/realms/MyStackOverflow")
        // Must match the client ids that already exist in the realm - these are
        // the same values development reads from webapp/.env.local.
        .WithEnvironment("AUTH_KEYCLOACK_ID", "Next JS Client")
        .WithEnvironment("AUTH_KEYCLOACK_SECRET", keycloakClientSecret)
        .WithEnvironment("AUTH_KEYCLOACK_ADMIN_CLIENT_ID", "webapp-admin")
        .WithEnvironment("AUTH_KEYCLOACK_ADMIN_CLIENT_SECRET", keycloakAdminClientSecret)
        .WithEnvironment("AUTH_SECRET", authSecret)
        .WithEnvironment("AUTH_URL", "https://app.mystackoverflow.local")
        // The webapp calls Keycloak server-side over the same public HTTPS URL
        // the browser uses, so node has to trust our self-signed CA.
        .WithEnvironment("NODE_EXTRA_CA_CERTS", "/etc/ssl/local/id.mystackoverflow.local.crt")
        // Server-side fetches stay inside the compose network, so this is the
        // gateway's service name rather than the public api.* hostname - and
        // its container port 5000, not the 8001 published on the host.
        .WithEnvironment("API_URL", "http://gateway:5000")
        .WithEnvironment("CLOUDINARY_CLOUD_NAME", cloudinaryCloudName)
        .WithEnvironment("CLOUDINARY_API_KEY", cloudinaryApiKey)
        .WithEnvironment("CLOUDINARY_API_SECRET", cloudinaryApiSecret)
        // Picked up by nginx-proxy to route the public hostname here.
        .WithEnvironment("VIRTUAL_HOST", "app.mystackoverflow.local")
        .WithEnvironment("VIRTUAL_PORT", "3000")
        .PublishAsDockerComposeService((_, service) =>
        {
            // Supplies the certificate NODE_EXTRA_CA_CERTS points at. Added here
            // rather than WithBindMount, which only exists for container
            // resources - a JavaScript app becomes one only when published.
            //
            // Reuses the placeholder Aspire generates for nginx-proxy's mount of
            // the same directory: it resolves to an absolute host path, so it
            // stays correct wherever the compose file is written, which a
            // relative source would not.
            service.Volumes.Add(new Volume
            {
                Name = "webapp-certs",
                Type = "bind",
                Source = "${NGINX_PROXY_BINDMOUNT_0}",
                Target = "/etc/ssl/local",
                ReadOnly = true,
            });
        });
}

if (!builder.Environment.IsDevelopment())
{
    builder.AddContainer("nginx-proxy", "nginxproxy/nginx-proxy", "1.10")
        .WithEndpoint(80, 80, "nginx", isExternal: true)
        .WithEndpoint(443, 443, "nginx-https", isExternal: true)
        .WithBindMount("/var/run/docker.sock", "/tmp/docker.sock", true)
        // nginx-proxy turns on TLS by itself once it finds <VIRTUAL_HOST>.crt
        // and .key here, and redirects HTTP to HTTPS for those hosts.
        .WithBindMount("../infra/certs", "/etc/nginx/certs", true)
        // nginx-proxy includes every *.conf here alongside its generated config.
        .WithBindMount("../infra/nginx/proxy-buffers.conf", "/etc/nginx/conf.d/proxy-buffers.conf", true)
        .PublishAsDockerComposeService((_, service) =>
        {
            // Names the container after the public Keycloak hostname so Docker's
            // own DNS resolves it inside the network - that is what the webapp
            // needs for server-side token refresh and the admin API.
            //
            // Neither of the obvious alternatives works here: compose `links` is
            // ignored on user-defined networks, and an extra_hosts entry is
            // written into /etc/hosts but Alpine's libc resolves the name via
            // Docker's DNS anyway, which answers 127.0.0.1 from the host's own
            // hosts file. Aspire's compose model exposes no network aliases.
            service.ContainerName = "id.mystackoverflow.local";
        });
}

builder.Build().Run();