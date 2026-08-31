using Common;
using JasperFx;
using Marten;
using StatsService.Models;
using Wolverine.ErrorHandling;
using Wolverine.Marten;
using Wolverine.RabbitMQ;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// No Keycloak here: this service only serves public read models built from events.
// It also uses no Entity Framework - Marten treats Postgres as a document store, so
// there is no DbContext and no migrations, just documents.
builder.Services.AddMarten(opts =>
{
    opts.Connection(builder.Configuration.GetConnectionString("statsDb")
                    ?? throw new InvalidOperationException("statsDb connection string not found"));
})
.UseLightweightSessions()
.IntegrateWithWolverine();

await builder.UseWolverineWithRabbitMqAsync(opts =>
{
    opts.ListenToRabbitQueue("question.stats", cfg => cfg.BindExchange("questions"));

    // Both handlers here are counters: load the day's document, add to it, store it.
    // Marten's optimistic concurrency (see the documents) makes a concurrent write
    // fail rather than silently overwrite, and this turns that failure into a retry
    // that re-reads the committed value. Without it the exception would be the bug
    // instead of the lost update - the cooldowns are short because the contended
    // window is a single round trip.
    opts.OnException<ConcurrencyException>()
        .RetryWithCooldown(
            TimeSpan.FromMilliseconds(50),
            TimeSpan.FromMilliseconds(150),
            TimeSpan.FromMilliseconds(400));

    opts.ApplicationAssembly = typeof(Program).Assembly;
});

var app = builder.Build();

// Public: the tags page and question list are already visible to anyone.
app.MapGet("/stats/trending-tags", async (IQuerySession session) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    // Six days back plus today - a rolling week, not a calendar one.
    var start = today.AddDays(-6);

    var rows = await session.Query<TagDailyUsage>()
        .Where(x => x.Date >= start && x.Date <= today)
        .Select(x => new {x.Tag, x.Count})
        .ToListAsync();

    // Grouped in memory: the window is at most seven documents per tag, so this is
    // far cheaper than asking Postgres to group across JSON documents.
    var top = rows
        .GroupBy(x => x.Tag)
        .Select(g => new TrendingTag(g.Key, g.Sum(x => x.Count)))
        .OrderByDescending(x => x.Count)
        .Take(5)
        .ToList();

    return Results.Ok(top);
});

// Who has gained the most reputation this week - not who has the highest total, which
// is a different question and lives on the profile.
app.MapGet("/stats/top-users", async (IQuerySession session) =>
{
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    var start = today.AddDays(-6);

    var rows = await session.Query<UserDailyReputation>()
        .Where(x => x.Date >= start && x.Date <= today)
        .Select(x => new {x.UserId, x.Delta})
        .ToListAsync();

    var top = rows
        .GroupBy(x => x.UserId)
        .Select(g => new TopUser(g.Key, g.Sum(x => x.Delta)))
        // Someone who only lost reputation this week is not a "top user".
        .Where(x => x.Gained > 0)
        .OrderByDescending(x => x.Gained)
        .Take(5)
        .ToList();

    return Results.Ok(top);
});

app.MapDefaultEndpoints();

app.Run();

public record TrendingTag(string Tag, int Count);
// No display name here: StatsService knows ids, ProfileService knows names.
public record TopUser(string UserId, int Gained);
