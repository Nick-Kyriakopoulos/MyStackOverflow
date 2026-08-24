namespace QuestionService.DTOs;

// Bound from the query string. Sort values match the tabs the client already renders:
// newest, active, unanswered.
public record QuestionParams(string? Tag, string? Sort, int? Page, int? PageSize);
