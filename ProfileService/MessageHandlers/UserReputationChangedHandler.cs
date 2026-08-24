using Microsoft.EntityFrameworkCore;
using Contracts;
using ProfileService.Data;

namespace ProfileService.MessageHandlers;

// The running total lives here, on the profile, because that is what every question
// card and profile page reads. StatsService separately keeps the daily deltas, which
// answer a different question: who has gained recently.
public class UserReputationChangedHandler
{
    public async Task HandleAsync(UserReputationChanged message, ProfileDbContext db)
    {
        // ExecuteUpdate rather than load-modify-save: concurrent votes on the same
        // author would otherwise overwrite each other's totals.
        var updated = await db.Profiles
            .Where(p => p.Id == message.UserId)
            .ExecuteUpdateAsync(x =>
                x.SetProperty(p => p.Reputation, p => p.Reputation + message.Delta));

        // No profile yet means the user has never signed in since ProfileService
        // existed. Dropping the delta is the honest outcome - inventing a profile here
        // would create one with no display name.
        if (updated == 0)
        {
            Console.WriteLine($"No profile for {message.UserId}; reputation change ignored.");
        }
    }
}
