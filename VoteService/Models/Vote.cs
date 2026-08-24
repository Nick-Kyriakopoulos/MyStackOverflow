using System.ComponentModel.DataAnnotations;

namespace VoteService.Models;

// One row per user per target, and it never changes. The course states the rule as a
// deliberate simplification: a vote cannot be withdrawn or flipped. That is why the
// client fetches existing votes and disables the buttons rather than toggling them.
public class Vote
{
    [MaxLength(36)]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(36)]
    public required string UserId { get; set; }
    // The question or answer being voted on.
    [MaxLength(36)]
    public required string TargetId { get; set; }
    [MaxLength(10)]
    public required string TargetType { get; set; }
    // +1 or -1. Stored rather than derived so the tally can be recomputed if needed.
    public int Value { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
