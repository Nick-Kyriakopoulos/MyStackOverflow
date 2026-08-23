using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace QuestionService.Data;

// `dotnet ef` builds the host to find the DbContext, but Program.cs waits on a RabbitMQ
// connection before Build() returns - so generating a migration would otherwise require
// the whole Aspire stack to be running. EF uses this factory instead when present.
//
// The connection string is never used: migrations are generated from the model, and
// applied at runtime with the real Aspire-provided connection.
public class QuestionDbContextFactory : IDesignTimeDbContextFactory<QuestionDbContext>
{
    public QuestionDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<QuestionDbContext>()
            .UseNpgsql("Host=localhost;Database=questionDb;Username=postgres;Password=design-time")
            .Options;

        return new QuestionDbContext(options);
    }
}
