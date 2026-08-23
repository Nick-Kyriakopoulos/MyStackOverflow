using System.ComponentModel.DataAnnotations;

namespace QuestionService.Models;

public class Question
{
    [MaxLength(36)]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(300)]
    public required string Title { get; set; }
    [MaxLength(5000)]
    public required string Content { get; set; }
    // The display name lives in ProfileService now - a copy here would go stale the
    // moment someone renamed themselves.
    [MaxLength(36)]
    public required string AskerId { get; set; }
    public DateTime CreatedAt { get; set; } =  DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int ViewCount { get; set; }
    public List<string> TagSlugs { get; set; } = [];
    public bool HasAcceptedAnswer { get; set; }
    public int Votes { get; set; }
    
    public int AnswerCount { get; set; }
    
    //nav properties
    public List<Answer> Answers { get; set; } = [];
}