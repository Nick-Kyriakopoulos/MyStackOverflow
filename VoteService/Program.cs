using System.Security.Claims;
using Common;
using Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using VoteService.Data;
using VoteService.Models;
using Wolverine;
using Wolverine.RabbitMQ;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddKeyCloakAuthentication();
// Minimal APIs do not get this from AddControllers - see ProfileService.
builder.Services.AddAuthorization();
builder.AddNpgsqlDbContext<VoteDbContext>("voteDb");

await builder.UseWolverineWithRabbitMqAsync(opts =>
{
    opts.PublishAllMessages().ToRabbitExchange("questions");
    opts.ApplicationAssembly = typeof(Program).Assembly;
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapPost("/votes", [Authorize] async (
    CastVoteDto dto,
    ClaimsPrincipal user,
    VoteDbContext db,
    IMessageBus bus) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null) return Results.BadRequest("Cannot get user details");

    var targetType = dto.TargetType.ToLowerInvariant();
    if (targetType is not ("question" or "answer")) return Results.BadRequest("Unknown target type");
    if (dto.VoteValue is not (1 or -1)) return Results.BadRequest("A vote must be +1 or -1");

    // A vote is final. Checked here for a clear message, and enforced by a unique
    // index for the case where two requests arrive at once.
    if (await db.Votes.AnyAsync(v => v.UserId == userId && v.TargetId == dto.TargetId))
    {
        return Results.Conflict("You have already voted on this");
    }

    db.Votes.Add(new Vote
    {
        UserId = userId,
        TargetId = dto.TargetId,
        TargetType = targetType,
        Value = dto.VoteValue
    });

    try
    {
        await db.SaveChangesAsync();
    }
    catch (DbUpdateException)
    {
        // The unique index caught a race the check above could not.
        return Results.Conflict("You have already voted on this");
    }

    // QuestionService updates the tally and awards the reputation - it is the only
    // service that authoritatively knows who wrote the target.
    await bus.PublishAsync(new VoteCast(dto.TargetId, targetType, dto.VoteValue, userId));

    return Results.Ok();
});

// Lets the client disable buttons for things this user has already voted on.
app.MapGet("/votes/mine", [Authorize] async (string targetIds, ClaimsPrincipal user, VoteDbContext db) =>
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId is null) return Results.BadRequest("Cannot get user details");

    var wanted = targetIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    if (wanted.Length == 0) return Results.Ok(Array.Empty<VoteRecord>());

    // Always 200 with whatever was found - the web app turns a 404 into notFound().
    var votes = await db.Votes
        .Where(v => v.UserId == userId && wanted.Contains(v.TargetId))
        .Select(v => new VoteRecord(v.TargetId, v.TargetType, v.Value))
        .ToListAsync();

    return Results.Ok(votes);
});

app.MapDefaultEndpoints();

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<VoteDbContext>();
    await context.Database.MigrateAsync();
}
catch (Exception e)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(e, "An error occurred while migrating the database.");
}

app.Run();

public record CastVoteDto(string TargetId, string TargetType, int VoteValue);
public record VoteRecord(string TargetId, string TargetType, int Value);
