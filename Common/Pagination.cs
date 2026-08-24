using Microsoft.EntityFrameworkCore;

namespace Common;

// Offset paging rather than cursor: it is simpler, and it lets someone jump straight to
// page five, which a cursor cannot. If this ever holds millions of questions the deep
// pages will get slow and cursor paging becomes the right answer.
public record PaginationRequest(int? Page, int? PageSize)
{
    private const int DefaultPageSize = 5;
    private const int MaxPageSize = 50;

    // Clamped rather than validated: a nonsensical page is not worth a 400, and the
    // ceiling stops a caller asking for the whole table in one request.
    public int Skip => (Math.Max(Page ?? 1, 1) - 1) * Take;
    public int Take => Math.Clamp(PageSize ?? DefaultPageSize, 1, MaxPageSize);
    public int CurrentPage => Math.Max(Page ?? 1, 1);
}

public record PaginationResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    // The total across all pages, not the size of Items - the client needs it to know
    // how many pages exist.
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public static class PaginationExtensions
{
    public static async Task<PaginationResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, PaginationRequest request)
    {
        // Counted before paging is applied, and deliberately a separate round trip:
        // combining them would mean loading every row to count them.
        var totalCount = await query.CountAsync();

        var items = await query
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync();

        return new PaginationResult<T>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.CurrentPage,
            PageSize = request.Take
        };
    }
}
