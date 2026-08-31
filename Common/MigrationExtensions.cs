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
    // The failure is logged and then rethrown, so the service does not start. Earlier
    // this swallowed it, which is far worse now that four services share the one
    // helper: a service whose migration failed came up reporting healthy - the health
    // check knows nothing about schema - and answered every request with a 500 against
    // a stale schema, with the cause buried in startup logs nobody was reading. Dying
    // on boot is louder and much easier to diagnose, and Aspire already sequences the
    // database with WaitFor, so a failure here is a real one rather than a race.
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
            throw;
        }
    }
}
