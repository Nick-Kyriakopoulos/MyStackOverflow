using Contracts;
using Marten;
using StatsService.Models;

namespace StatsService.MessageHandlers;

// Deliberately only new questions: edits that add a tag do not count towards trending.
// The course keeps it at that, and it keeps the projection a pure append.
public class QuestionCreatedHandler
{
    public async Task HandleAsync(QuestionCreated message, IDocumentSession session)
    {
        var date = DateOnly.FromDateTime(message.Created);

        foreach (var tag in message.Tags.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var id = TagDailyUsage.KeyFor(tag, date);
            var usage = await session.LoadAsync<TagDailyUsage>(id);

            if (usage is null)
            {
                usage = new TagDailyUsage {Id = id, Tag = tag, Date = date, Count = 1};
            }
            else
            {
                usage.Count++;
            }

            session.Store(usage);
        }

        await session.SaveChangesAsync();
    }
}
