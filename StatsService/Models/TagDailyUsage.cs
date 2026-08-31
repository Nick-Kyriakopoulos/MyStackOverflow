using Marten.Schema;

namespace StatsService.Models;

// One document per tag per day. Trending tags are then a matter of summing the last
// seven days - a question the running total on QuestionService.Tag cannot answer,
// since that only ever grows.
//
// The handler reads this document, increments it and writes it back, which is a lost
// update waiting to happen: two questions tagged "aspire" on the same day, handled
// concurrently, both read Count = 1 and both write 2. Optimistic concurrency turns
// that into a ConcurrencyException, which Wolverine retries (see Program.cs) - the
// retry reads the committed value and adds to it.
[UseOptimisticConcurrency]
public class TagDailyUsage
{
    // Marten needs an identity, and composing it from the tag and the day makes the
    // write idempotent: the same tag used twice in a day updates one document.
    public required string Id { get; set; }
    public required string Tag { get; set; }
    public DateOnly Date { get; set; }
    public int Count { get; set; }

    public static string KeyFor(string tag, DateOnly date) => $"{tag}:{date:yyyy-MM-dd}";
}
