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

    profile = new Profile { Id = userId, DisplayName = name };
    db.Profiles.Add(profile);
    await db.SaveChangesAsync();

    return Results.Ok(profile);
});

app.MapPut("/profiles/me", [Authorize] async (UpdateProfileDto dto, ClaimsPrincipal user, ProfileDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null) return Results.BadRequest("Cannot get user details");

    var profile = await db.Profiles.FindAsync(userId);
    if (profile is null) return Results.NotFound();

    profile.DisplayName = dto.DisplayName;
    profile.ImageUrl = dto.ImageUrl;
    profile.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(profile);
});

app.MapDefaultEndpoints();

await app.MigrateDatabaseAsync<ProfileDbContext>();

app.Run();

public record UpdateProfileDto(string DisplayName, string? ImageUrl);
