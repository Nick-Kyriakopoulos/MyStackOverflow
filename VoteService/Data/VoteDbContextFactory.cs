using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VoteService.Data;

// `dotnet ef` builds the host to find the DbContext, but Program.cs waits on a RabbitMQ
// connection before Build() returns - so generating a migration would otherwise require
// the whole Aspire stack to be running. EF uses this factory instead when present.
//
// The connection string is never used: migrations are generated from the model, and
// applied at runtime with the real Aspire-provided connection.
public class VoteDbContextFactory : IDesignTimeDbContextFactory<VoteDbContext>
{
    public VoteDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<VoteDbContext>()
            .UseNpgsql("Host=localhost;Database=voteDb;Username=postgres;Password=design-time")
            .Options;

        return new VoteDbContext(options);
    }
}
