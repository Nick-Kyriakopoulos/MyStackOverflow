namespace StatsService.Models;

// Reputation *earned on a day*, not the running total - that lives on the profile.
// Keeping deltas per day is what makes "top users this week" answerable at all.
public class UserDailyReputation
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public DateOnly Date { get; set; }
    public int Delta { get; set; }

    public static string KeyFor(string userId, DateOnly date) => $"{userId}:{date:yyyy-MM-dd}";
}
