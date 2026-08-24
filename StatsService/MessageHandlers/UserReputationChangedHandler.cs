using Contracts;
using Marten;
using StatsService.Models;

namespace StatsService.MessageHandlers;

// The same event ProfileService handles, read for a different purpose: it keeps the
// total, this keeps the daily movement.
public class UserReputationChangedHandler
{
    public async Task HandleAsync(UserReputationChanged message, IDocumentSession session)
    {
        var date = DateOnly.FromDateTime(message.Occurred);
        var id = UserDailyReputation.KeyFor(message.UserId, date);

        var daily = await session.LoadAsync<UserDailyReputation>(id);

        if (daily is null)
        {
            daily = new UserDailyReputation
            {
                Id = id,
                UserId = message.UserId,
                Date = date,
                Delta = message.Delta
            };
        }
        else
        {
            daily.Delta += message.Delta;
        }

        session.Store(daily);
        await session.SaveChangesAsync();
    }
}
