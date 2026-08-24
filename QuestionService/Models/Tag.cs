using System.ComponentModel.DataAnnotations;

namespace QuestionService.Models;

public class Tag
{
    [MaxLength(36)]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(50)]
    public required string Name { get; set; }
    [MaxLength(50)]
    public required string Slug { get; set; }
    [MaxLength(1000)]
    public required string Description { get; set; }
    // Running total of questions carrying this tag. Maintained outside the question's
    // own transaction - see QuestionsController - because a miscounted tag is not worth
    // failing someone's question over. Trending tags are a separate, time-windowed
    // question answered by StatsService.
    public int UsageCount { get; set; }
}