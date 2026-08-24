using Microsoft.EntityFrameworkCore;
using VoteService.Models;

namespace VoteService.Data;

public class VoteDbContext(DbContextOptions options) : DbContext(options)
{
    public DbSet<Vote> Votes { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // The "one vote per user per target" rule enforced where it cannot be raced.
        // Two simultaneous requests would both pass an application-level check.
        builder.Entity<Vote>()
            .HasIndex(v => new {v.UserId, v.TargetId})
            .IsUnique();
    }
}
