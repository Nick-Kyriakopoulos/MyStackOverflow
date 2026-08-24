namespace Contracts;

// TargetType is "question" or "answer". Carries no author id on purpose: VoteService
// does not know who wrote the thing being voted on, and a client-supplied author would
// be forgeable. QuestionService owns that fact and awards the reputation.
public record VoteCast(string TargetId, string TargetType, int VoteValue, string ActorUserId);
