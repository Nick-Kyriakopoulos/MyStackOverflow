using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Common;

public static class AuthExtensions
{
    public static IServiceCollection AddKeyCloakAuthentication(this IServiceCollection services)
    {
        services.AddAuthentication()
            .AddKeycloakJwtBearer(serviceName: "keycloak" , realm: "MyStackOverflow" , options =>
            {
                options.RequireHttpsMetadata = false;
                options.Audience = "MyStackOverflow";
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuers =
                    [
                        "http://localhost:6001/realms/MyStackOverflow",
                        "http://keycloak/realms/MyStackOverflow",
                        "http://id.MyStackOverflow.local/realms/MyStackOverflow",
                        "http://id.mystackoverflow.local/realms/MyStackOverflow"
                    ],
                };
            });
        return services;
    }
}