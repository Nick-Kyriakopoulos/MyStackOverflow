using Contracts;

namespace Reputation;

// A library of its own because the scores are needed in three places - VoteService,
// QuestionService and StatsService - and none of them owns the rule. Contracts is the
// wrong home: it carries shapes, not policy.
public static class ReputationHelper
{
    private static int GetDelta(ReputationReason reason) => reason switch
    {
        ReputationReason.QuestionUpvoted => 5,
        ReputationReason.QuestionDownvoted => -2,
        ReputationReason.AnswerUpvoted => 5,
        ReputationReason.AnswerDownvoted => -2,
        // Accepting an answer is the biggest single award, and doubles as the default.
        _ => 15
    };

    public static UserReputationChanged MakeEvent(string userId, ReputationReason reason, string actorUserId)
        => new(
            UserId: userId,
            Delta: GetDelta(reason),
            Reason: reason,
            ActorUserId: actorUserId,
            Occurred: DateTime.UtcNow);
}
