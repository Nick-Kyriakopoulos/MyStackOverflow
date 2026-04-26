using Microsoft.EntityFrameworkCore;
using QuestionService.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.AddServiceDefaults();
builder.Services.AddAuthentication()
    .AddKeycloakJwtBearer(serviceName: "keycloak" , realm: "MyStackOverflow" , options =>
    {
        options.RequireHttpsMetadata = false;

        // TODO: Fix auth for production before going live.
        // Steps when ready:
        //   1. Create a dedicated API client in Keycloak (e.g. "question-api")
        //   2. Add an Audience mapper on the token-issuing client so aud = "question-api"
        //   3. Remove the IsDevelopment() block below and set: options.Audience = "question-api"
        //   4. Remove hardcoded Authority/MetadataAddress — let Aspire service discovery resolve them
        if (builder.Environment.IsDevelopment())
        {
            options.Authority = "http://localhost:6001/realms/MyStackOverflow";
            options.MetadataAddress = "http://localhost:6001/realms/MyStackOverflow/.well-known/openid-configuration";
            options.TokenValidationParameters.ValidateAudience = false;
            options.TokenValidationParameters.ValidateIssuer = false;
        }
        else
        {
            options.Audience = "MyStackOverflow";
        }
    });

builder.AddNpgsqlDbContext<QuestionDbContext>("questionDb");



var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapDefaultEndpoints();

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<QuestionDbContext>();
    await context.Database.MigrateAsync();
}
catch (Exception e)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(e, "An error occurred while migrating or seeding the database.");
}

app.Run();