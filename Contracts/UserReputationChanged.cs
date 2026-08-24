namespace Contracts;

// UserId is whose reputation moved; ActorUserId is who caused it. They differ for a
// vote and are the same only in edge cases, so both are carried.
public record UserReputationChanged(
    string UserId,
    int Delta,
    ReputationReason Reason,
    string ActorUserId,
    DateTime Occurred);
