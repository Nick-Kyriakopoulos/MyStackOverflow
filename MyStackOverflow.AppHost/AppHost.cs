var builder = DistributedApplication.CreateBuilder(args);

var keycloak = builder.AddKeycloak("keycloack", 6001)
    .WithDataVolume("keycloak-data");

builder.Build().Run();