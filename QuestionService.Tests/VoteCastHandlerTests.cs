using Contracts;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using QuestionService.Data;
using QuestionService.MessageHandlers;
using QuestionService.Models;
using Reputation;
using Wolverine;

namespace QuestionService.Tests;

// Sqlite rather than the InMemory provider: the handler uses ExecuteUpdateAsync,
// which only relational providers implement. In-memory Sqlite keeps the database
// alive for as long as the connection is open, so each test gets a clean one.
public class VoteCastHandlerTests : IDisposable
{
    private const string Author = "author-id";
    private const string Voter = "voter-id";

    private readonly SqliteConnection _connection;
    private readonly QuestionDbContext _db;
    private readonly IMessageBus _bus = Substitute.For<IMessageBus>();
    private readonly VoteCastHandler _handler = new();

    public VoteCastHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<QuestionDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new QuestionDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }

    private async Task<Question> GivenQuestion(string askerId = Author)
    {
        var question = new Question
        {
            Title = "A question",
            Content = "Body",
            AskerId = askerId,
        };

        _db.Questions.Add(question);
        await _db.SaveChangesAsync();

        return question;
    }

    private async Task<Answer> GivenAnswer(string userId = Author)
    {
        var question = await GivenQuestion("someone-else");

        var answer = new Answer
        {
            Content = "An answer",
            UserId = userId,
            QuestionId = question.Id,
        };

        _db.Answers.Add(answer);
        await _db.SaveChangesAsync();

        return answer;
    }

    [Fact]
    public async Task Upvoting_a_question_raises_its_tally_and_awards_the_asker()
    {
        var question = await GivenQuestion();

        await _handler.HandleAsync(new VoteCast(question.Id, "question", 1, Voter), _db, _bus);

        Assert.Equal(1, (await _db.Questions.AsNoTracking().SingleAsync()).Votes);

        await _bus.Received(1).PublishAsync(Arg.Is<UserReputationChanged>(e =>
            e.UserId == Author && e.Delta == 5 && e.Reason == ReputationReason.QuestionUpvoted));
    }

    [Fact]
    public async Task Downvoting_a_question_lowers_the_tally_and_costs_the_asker()
    {
        var question = await GivenQuestion();

        await _handler.HandleAsync(new VoteCast(question.Id, "question", -1, Voter), _db, _bus);

        Assert.Equal(-1, (await _db.Questions.AsNoTracking().SingleAsync()).Votes);

        await _bus.Received(1).PublishAsync(Arg.Is<UserReputationChanged>(e =>
            e.Delta == -2 && e.Reason == ReputationReason.QuestionDownvoted));
    }

    [Fact]
    public async Task Upvoting_an_answer_raises_its_tally_and_awards_its_author()
    {
        var answer = await GivenAnswer();

        await _handler.HandleAsync(new VoteCast(answer.Id, "answer", 1, Voter), _db, _bus);

        Assert.Equal(1, (await _db.Answers.AsNoTracking().SingleAsync()).Votes);

        await _bus.Received(1).PublishAsync(Arg.Is<UserReputationChanged>(e =>
            e.UserId == Author && e.Reason == ReputationReason.AnswerUpvoted));
    }

    // The bug this covers: the self-vote guard used to run *after* the tally update,
    // so posting straight to /votes on your own question still moved its score while
    // the UI insisted it could not.
    [Fact]
    public async Task Voting_on_your_own_question_changes_nothing_at_all()
    {
        var question = await GivenQuestion(askerId: Voter);

        await _handler.HandleAsync(new VoteCast(question.Id, "question", 1, Voter), _db, _bus);

        Assert.Equal(0, (await _db.Questions.AsNoTracking().SingleAsync()).Votes);
        await _bus.DidNotReceive().PublishAsync(Arg.Any<UserReputationChanged>());
    }

    [Fact]
    public async Task Voting_on_your_own_answer_changes_nothing_at_all()
    {
        var answer = await GivenAnswer(userId: Voter);

        await _handler.HandleAsync(new VoteCast(answer.Id, "answer", 1, Voter), _db, _bus);

        Assert.Equal(0, (await _db.Answers.AsNoTracking().SingleAsync()).Votes);
        await _bus.DidNotReceive().PublishAsync(Arg.Any<UserReputationChanged>());
    }

    [Fact]
    public async Task A_vote_on_a_target_that_no_longer_exists_is_ignored()
    {
        await _handler.HandleAsync(new VoteCast("deleted-id", "question", 1, Voter), _db, _bus);

        await _bus.DidNotReceive().PublishAsync(Arg.Any<UserReputationChanged>());
    }
}
