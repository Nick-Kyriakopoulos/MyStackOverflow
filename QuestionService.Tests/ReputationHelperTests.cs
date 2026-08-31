using Contracts;
using Reputation;

namespace QuestionService.Tests;

// The scores are policy shared by three services, so they are worth pinning down:
// a silent change here quietly rewrites everyone's reputation.
public class ReputationHelperTests
{
    [Theory]
    [InlineData(ReputationReason.QuestionUpvoted, 5)]
    [InlineData(ReputationReason.AnswerUpvoted, 5)]
    [InlineData(ReputationReason.QuestionDownvoted, -2)]
    [InlineData(ReputationReason.AnswerDownvoted, -2)]
    [InlineData(ReputationReason.AnswerAccepted, 15)]
    public void Each_reason_is_worth_its_documented_score(ReputationReason reason, int expected)
    {
        var result = ReputationHelper.MakeEvent("user", reason, "actor");

        Assert.Equal(expected, result.Delta);
    }

    [Fact]
    public void The_event_credits_the_author_and_records_who_caused_it()
    {
        var result = ReputationHelper.MakeEvent("author", ReputationReason.AnswerAccepted, "asker");

        Assert.Equal("author", result.UserId);
        Assert.Equal("asker", result.ActorUserId);
        Assert.Equal(ReputationReason.AnswerAccepted, result.Reason);
    }
}
