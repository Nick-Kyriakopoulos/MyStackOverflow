using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Common;

public static class MigrationExtensions
{
    // Every EF-backed service ran a byte-for-byte copy of this block. Seed data is
    // applied by the migrations themselves (HasData), so there is nothing else to do.
    //
    // Failures are logged rather than thrown, matching the previous behaviour: a
    // service that cannot migrate still starts, and says why in its logs, instead of
    // taking the whole Aspire stack down on boot.
    public static async Task MigrateDatabaseAsync<TContext>(this IHost host)
        where TContext : DbContext
    {
        using var scope = host.Services.CreateScope();
        var services = scope.ServiceProvider;

        try
        {
            var context = services.GetRequiredService<TContext>();
            await context.Database.MigrateAsync();
        }
        catch (Exception e)
        {
            var logger = services.GetRequiredService<ILoggerFactory>()
                .CreateLogger(typeof(TContext).Name);

            logger.LogError(e, "An error occurred while migrating the database.");
        }
    }
}
