using Contracts;
using Microsoft.EntityFrameworkCore;
using QuestionService.Data;
using Reputation;
using Wolverine;

namespace QuestionService.MessageHandlers;

// QuestionService's first message handler - until now it only published.
//
// It also awards the reputation rather than VoteService doing so. VoteService knows a
// vote happened but not who wrote the target, and letting the client supply that would
// let anyone award reputation to whoever they liked. The author is read from the
// database here instead.
public class VoteCastHandler
{
    public async Task HandleAsync(VoteCast message, QuestionDbContext db, IMessageBus bus)
    {
        string? authorId;
        ReputationReason reason;

        if (message.TargetType == "question")
        {
            authorId = await db.Questions
                .Where(q => q.Id == message.TargetId)
                .Select(q => q.AskerId)
                .FirstOrDefaultAsync();

            if (authorId is null) return;

            await db.Questions.Where(q => q.Id == message.TargetId)
                .ExecuteUpdateAsync(x => x.SetProperty(q => q.Votes, q => q.Votes + message.VoteValue));

            reason = message.VoteValue > 0
                ? ReputationReason.QuestionUpvoted
                : ReputationReason.QuestionDownvoted;
        }
        else
        {
            authorId = await db.Answers
                .Where(a => a.Id == message.TargetId)
                .Select(a => a.UserId)
                .FirstOrDefaultAsync();

            if (authorId is null) return;

            await db.Answers.Where(a => a.Id == message.TargetId)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.Votes, a => a.Votes + message.VoteValue));

            reason = message.VoteValue > 0
                ? ReputationReason.AnswerUpvoted
                : ReputationReason.AnswerDownvoted;
        }

        // Voting on your own post moves the tally but earns nothing.
        if (authorId == message.ActorUserId) return;

        await bus.PublishAsync(ReputationHelper.MakeEvent(authorId, reason, message.ActorUserId));
    }
}
