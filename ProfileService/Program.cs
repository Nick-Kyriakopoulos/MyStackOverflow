using System.Security.Claims;
using Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ProfileService.Data;
using ProfileService.Models;
using Wolverine.RabbitMQ;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddKeyCloakAuthentication();
// Explicit here, unlike QuestionService: AddControllers() registers the authorization
// services as a side effect, and this service has no controllers. Without it
// UseAuthorization() throws at startup.
builder.Services.AddAuthorization();
builder.AddNpgsqlDbContext<ProfileDbContext>("profileDb");

// This service joins the bus from Section 12 on: reputation is earned through votes
// and accepted answers, which happen in other services, but the total belongs here.
await builder.UseWolverineWithRabbitMqAsync(opts =>
{
    opts.ListenToRabbitQueue("question.profiles", cfg => cfg.BindExchange("questions"));
    opts.ApplicationAssembly = typeof(Program).Assembly;
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Reads are public: the question list already shows every title, body and tag to
// anonymous visitors, and the author id is in that payload regardless. Hiding only the
// name would protect nothing and would 401 on every anonymous render of /questions.
app.MapGet("/profiles/{id}", async (string id, ProfileDbContext db) =>
{
    var profile = await db.Profiles.FindAsync(id);

    return profile is null ? Results.NotFound() : Results.Ok(profile);
});

// Deliberately answers 200 with whatever it found. A 404 here would take down a whole
// question list, because the web app turns any 404 into Next's notFound().
app.MapGet("/profiles/batch", async (string ids, ProfileDbContext db) =>
{
    var wanted = ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    if (wanted.Length == 0) return Results.Ok(Array.Empty<Profile>());

    var profiles = await db.Profiles.Where(p => wanted.Contains(p.Id)).ToListAsync();

    return Results.Ok(profiles);
});

// Called from the web app's jwt callback on sign-in. Idempotent: Keycloak owns
// registration, so the first time we see a token we materialise the profile from it.
app.MapPost("/profiles/ensure", [Authorize] async (ClaimsPrincipal user, ProfileDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    // Keycloak only emits "name" once the account has both a first and a last name.
    // Accounts registered without them still need a profile, so fall back to the
    // username they signed in with.
    var name = user.FindFirstValue("name") ?? user.FindFirstValue("preferred_username");

    if (userId is null || name is null) return Results.BadRequest("Cannot get user details");

    var profile = await db.Profiles.FindAsync(userId);

    if (profile is not null) return Results.Ok(profile);

    // Keycloak's name is not length-checked by anything upstream, and DisplayName is
    // capped at 300 - a long one would otherwise fail here as an unhandled 500.
    profile = new Profile { Id = userId, DisplayName = Truncate(name, 300) };
    db.Profiles.Add(profile);

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        // Check-then-insert is a race: two tabs signing in at once, or a retried
        // NextAuth callback, both read null and both insert. The loser hits the
        // primary key and would surface a 500 for what is a successful outcome -
        // the profile exists either way. VoteService handles its unique index the
        // same way. Detached first, or the failed insert stays tracked and the
        // reload below tries to add it again.
        db.Entry(profile).State = EntityState.Detached;

        var existing = await db.Profiles.FindAsync(userId);
        if (existing is null) throw;

        return Results.Ok(existing);
    }

    return Results.Ok(profile);
});

app.MapPut("/profiles/me", [Authorize] async (UpdateProfileDto dto, ClaimsPrincipal user, ProfileDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null) return Results.BadRequest("Cannot get user details");

    // The zod schema in the web app caps these, but that only binds a browser: this
    // endpoint is reachable directly with a bearer token. Without the check, an
    // over-long value reaches a [MaxLength] column and comes back as an unhandled
    // DbUpdateException - a 500 for what is plainly a bad request.
    if (string.IsNullOrWhiteSpace(dto.DisplayName) || dto.DisplayName.Length > 300)
    {
        return Results.BadRequest("Display name must be between 1 and 300 characters");
    }

    if (dto.ImageUrl is {Length: > 500})
    {
        return Results.BadRequest("Image URL must be 500 characters or fewer");
    }

    var profile = await db.Profiles.FindAsync(userId);
    if (profile is null) return Results.NotFound();

    profile.DisplayName = dto.DisplayName;
    profile.ImageUrl = dto.ImageUrl;
    profile.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(profile);
});

// Keycloak controls neither of these lengths, so the value it hands us can exceed the
// column. Truncating beats rejecting: the user cannot fix their token, and a clipped
// display name is better than no profile at all.
static string Truncate(string value, int max) =>
    value.Length <= max ? value : value[..max];

app.MapDefaultEndpoints();

await app.MigrateDatabaseAsync<ProfileDbContext>();

app.Run();

public record UpdateProfileDto(string DisplayName, string? ImageUrl);
