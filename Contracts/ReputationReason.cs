namespace Contracts;

// Deliberately carries no scores: this is a contract shared across services, and how
// many points each reason is worth is business logic. That lives in the Reputation
// class library, which several services reference.
public enum ReputationReason
{
    QuestionUpvoted,
    QuestionDownvoted,
    AnswerUpvoted,
    AnswerDownvoted,
    AnswerAccepted
}
