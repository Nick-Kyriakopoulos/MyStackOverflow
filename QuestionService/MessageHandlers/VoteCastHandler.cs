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
// database here instead - which also makes this the only place a self-vote can be
// rejected, so the tally change lives here rather than in VoteService.
//
// Safe to redeliver: the listening endpoint uses Wolverine's durable inbox, which
// discards an envelope it has already handled. Without that the increments below,
// which are relative rather than absolute, would apply twice for one vote.
public class VoteCastHandler
{
    public async Task HandleAsync(VoteCast message, QuestionDbContext db, IMessageBus bus)
    {
        var isQuestion = message.TargetType == "question";

        // The author is read before anything is written, because it decides whether
        // the vote counts at all.
        var authorId = isQuestion
            ? await db.Questions
                .Where(q => q.Id == message.TargetId)
                .Select(q => q.AskerId)
                .FirstOrDefaultAsync()
            : await db.Answers
                .Where(a => a.Id == message.TargetId)
                .Select(a => a.UserId)
                .FirstOrDefaultAsync();

        if (authorId is null) return;

        // A self-vote does nothing at all - not the tally, not the reputation. This
        // used to skip only the reputation, so posting straight to /votes on your own
        // question still moved its score, while the UI disabled the buttons and said
        // "You cannot vote on your own post". VoteService cannot enforce this itself:
        // it does not know who wrote the target, and taking that from the client
        // would let anyone claim authorship.
        if (authorId == message.ActorUserId) return;

        if (isQuestion)
        {
            await db.Questions.Where(q => q.Id == message.TargetId)
                .ExecuteUpdateAsync(x => x.SetProperty(q => q.Votes, q => q.Votes + message.VoteValue));
        }
        else
        {
            await db.Answers.Where(a => a.Id == message.TargetId)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.Votes, a => a.Votes + message.VoteValue));
        }

        var reason = (isQuestion, up: message.VoteValue > 0) switch
        {
            (true, true) => ReputationReason.QuestionUpvoted,
            (true, false) => ReputationReason.QuestionDownvoted,
            (false, true) => ReputationReason.AnswerUpvoted,
            (false, false) => ReputationReason.AnswerDownvoted,
        };

        await bus.PublishAsync(ReputationHelper.MakeEvent(authorId, reason, message.ActorUserId));
    }
}
