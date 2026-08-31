using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuestionService.Data.Migrations
{
    /// <inheritdoc />
    // AddTagUsageCountAndAnswerVotes introduced UsageCount with defaultValue 0 and set
    // every seeded tag to 0, but nothing counted the questions already in the table.
    // On any database carried forward from Section 12 - which is all of them - the
    // counter only ever moved for questions asked after that migration ran, so /tags
    // showed "0 questions" against tags that plainly had some, permanently.
    //
    // This is a separate migration rather than a fix to that one: the original has
    // already been applied everywhere, and an edited migration is never re-run.
    public partial class BackfillTagUsageCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Matched on Slug, not Id: TagSlugs holds slugs, and that is what
            // QuestionsController compares against when it maintains the counter.
            // Safe to run on an already-correct database - it recomputes rather
            // than increments.
            migrationBuilder.Sql(
                """
                UPDATE "Tags" t
                SET "UsageCount" = (
                    SELECT COUNT(*)
                    FROM "Questions" q
                    WHERE t."Slug" = ANY(q."TagSlugs")
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The pre-backfill state was "whatever had accumulated since the column
            // was added", which is not reconstructible. Zeroing is the honest
            // inverse: it puts the column back to the value the Up of
            // AddTagUsageCountAndAnswerVotes left behind.
            migrationBuilder.Sql("""UPDATE "Tags" SET "UsageCount" = 0;""");
        }
    }
}
