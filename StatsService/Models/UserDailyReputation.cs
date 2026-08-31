using Marten.Schema;

namespace StatsService.Models;

// Reputation *earned on a day*, not the running total - that lives on the profile.
// Keeping deltas per day is what makes "top users this week" answerable at all.
//
// Same read-modify-write race as TagDailyUsage: two votes on the same author in
// one day, handled concurrently, would lose one delta. ProfileService avoids this by
// using ExecuteUpdateAsync; Marten's equivalent here is optimistic concurrency plus
// the retry policy in Program.cs.
[UseOptimisticConcurrency]
public class UserDailyReputation
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public DateOnly Date { get; set; }
    public int Delta { get; set; }

    public static string KeyFor(string userId, DateOnly date) => $"{userId}:{date:yyyy-MM-dd}";
}
