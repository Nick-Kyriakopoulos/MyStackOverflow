# MyStackOverflow — Agent Guide

A distributed Q&A platform (Stack Overflow clone) built with .NET Aspire microservices and a Next.js frontend.

---

## Architecture Overview

```
webapp (Next.js, :3000)
    └── API_URL ──► YARP Gateway (:8001)
                        ├── /questions/** ──► QuestionService
                        ├── /tags/**      ──► QuestionService
                        ├── /profiles/**  ──► ProfileService
                        ├── /stats/**     ──► StatsService
                        ├── /votes/**     ──► VoteService
                        └── /search/**    ──► SearchService

All events go through one fanout exchange, "questions":

VoteService ─[VoteCast]──────────────► QuestionService  (tally, then awards reputation)
QuestionService ─[UserReputationChanged]─┬► ProfileService  (running total)
                                         └► StatsService    (daily deltas)
QuestionService ─[QuestionCreated etc.]──┬► SearchService   (Typesense index)
                                         └► StatsService    (tag usage)
                        ↑
                   Keycloak (auth, :6001)
```

| Component | Technology | Port |
|---|---|---|
| AppHost | .NET Aspire orchestration | — |
| QuestionService | ASP.NET Core + EF Core + PostgreSQL | dynamic |
| SearchService | ASP.NET Core + Typesense + Wolverine | dynamic |
| ProfileService | ASP.NET Core minimal APIs + EF Core + PostgreSQL | dynamic |
| StatsService | ASP.NET Core minimal APIs + **Marten** (event sourced) | dynamic |
| VoteService | ASP.NET Core minimal APIs + EF Core + PostgreSQL | dynamic |
| YARP Gateway | Aspire-managed YARP reverse proxy | 8001 |
| WebApp | Next.js 16 / React 19 | 3000 |
| Keycloak | OAuth2/OIDC identity provider (realm: `MyStackOverflow`) | 6001 |
| RabbitMQ | Message broker (exchange: `questions`) | 5672 / mgmt 15672 |
| PostgreSQL | Databases: `questionDb`, `profileDb`, `statsDb`, `voteDb` | 5432 |
| Typesense | Full-text search engine (v29.0) | 8108 |

Keycloak owns registration and publishes nothing, so the web app creates the profile
from its `jwt` callback at sign-in rather than from an event.

**The exchange is fanout, and that is fine.** Every bound queue receives every message;
Wolverine silently discards types a service has no handler for, verified by publishing
a `QuestionDeleted` at StatsService and seeing an empty `wolverine_dead_letters`. Adding
a consumer needs no binding keys. The flip side is an operational blind spot: an
unhandled message and a *malformed* one look identical from outside — both vanish
without a trace. A payload whose enum was serialised as a string rather than an ordinal
disappeared exactly this way.

---

## Repository Layout

```
MyStackOverflow/
├── MyStackOverflow.AppHost/    # Aspire host — defines ALL service wiring (AppHost.cs)
├── MyStackOverflow.ServiceDefaults/  # Shared Aspire service defaults (health, OTEL)
├── Common/                     # AuthExtensions, WolverineExtensions, MigrationExtensions,
│                               #   Pagination (types + IQueryable extension)
├── Contracts/                  # Shared event records (C#): QuestionCreated, etc.
├── QuestionService/            # REST API for questions, answers, tags
│   ├── Controllers/            # QuestionsController, TagsController
│   ├── Models/                 # Question, Answer, Tag (EF Core entities)
│   ├── DTOs/                   # CreateQuestionDto, CreateAnswerDto
│   ├── Data/                   # QuestionDbContext (EF Core + seed data)
│   ├── Services/               # TagService (IMemoryCache, 2h TTL)
│   └── Validators/             # TagListValidator (custom DataAnnotations)
├── SearchService/              # Event-driven search indexing + search endpoints
│   ├── MessageHandlers/        # Wolverine handlers: QuestionCreatedHandler, etc.
│   ├── Models/                 # SearchQuestion (Typesense document)
│   └── Data/                   # SearchInitializer (ensures Typesense index exists)
├── ProfileService/             # Display name, avatar and reputation per Keycloak sub
│   ├── Program.cs              # ALL endpoints live here — minimal APIs, no controllers
│   ├── Models/                 # Profile (Id == the Keycloak `sub`)
│   ├── MessageHandlers/        # UserReputationChanged → the running total
│   └── Data/                   # ProfileDbContext + migrations
├── StatsService/               # Trending tags and top users. NO EF Core, NO migrations
│   ├── Program.cs              # Marten wiring + the read endpoints
│   ├── Models/                 # TagDailyUsage, UserDailyReputation (Marten documents)
│   └── MessageHandlers/        # QuestionCreated, UserReputationChanged
├── VoteService/                # One vote per user per target, final
│   ├── Program.cs              # POST /votes, GET /votes/mine
│   ├── Models/                 # Vote
│   └── Data/                   # VoteDbContext (+ the unique index) + migrations
├── Reputation/                 # Tiny library: how many points each reason is worth
├── infra/
│   ├── docker-compose.yaml     # Production compose (generated by Aspire)
│   └── realms/                 # Keycloak realm import JSON
└── webapp/                     # Next.js frontend
    └── src/
        ├── proxy.ts           # Fast signed-out redirect (NOT the security boundary)
        ├── auth.ts             # Auth.js v5 config + refresh rotation + ensureProfile
        ├── app/                # Next.js App Router pages
        ├── components/
        │   ├── layout/Panel.tsx        # The only definition of the page surfaces
        │   ├── profiles/UserBadge.tsx  # The only author byline in the app
        │   └── tags/TagLink.tsx        # The only tag chip
        └── lib/
            ├── actions/        # Server Actions ('use server') — API calls
            ├── schemas/        # zod schemas, re-validated server-side
            ├── types/index.ts  # Shared TypeScript types
            ├── fetchClient.ts  # Universal HTTP client (reads API_URL env var)
            ├── imageRules.ts   # Cloudinary folders + the delete whitelist
            └── useTagStore.ts  # Zustand global tag store
```

---

## Development Workflow

### Starting the Full Stack
Run everything from the AppHost (starts Keycloak, Postgres, RabbitMQ, Typesense, all services).

From Rider, just run the AppHost. **From a terminal you must set one env var first:**
```powershell
$env:ASPIRE_ALLOW_UNSECURED_TRANSPORT="true"
aspire run
```
`MyStackOverflow.AppHost/Properties/launchSettings.json` defines only an `http` profile,
and Aspire refuses a non-https `applicationUrl` without that variable — the AppHost exits
before the CLI can attach, and the only message you get is "AppHost process has exited
unexpectedly". Rider sets it for you, so this bites only from the CLI.

The dashboard is at `http://localhost:5001` (from that launch profile — not Aspire's
default 18888). Container ports for Postgres and Keycloak are **reassigned on every
restart**; read them from `docker ps` rather than hardcoding them.

### Frontend Only
```powershell
cd webapp
npm run dev      # http://localhost:3000
npm run build
npm run lint
```
Set `API_URL` env var to point to the YARP gateway (e.g., `http://localhost:8001`) when running outside Aspire.

### Database Migrations
QuestionService, ProfileService and VoteService each own their database. Migrations are
**applied automatically on startup** via `await app.MigrateDatabaseAsync<TContext>()`
from `Common` — one line per service, not a copy-pasted scope-and-try-catch block.
Failures are logged rather than thrown, so a service that cannot migrate still starts
and says why. StatsService has neither: Marten creates its document tables on demand.

To add a new migration:
```powershell
cd QuestionService     # or ProfileService
dotnet ef migrations add <MigrationName>
```

`dotnet ef` builds the host to find the DbContext, and QuestionService's `Program.cs`
waits on a RabbitMQ connection before `Build()` returns — so generating a migration
would otherwise require the whole stack to be running. `QuestionService/Data/QuestionDbContextFactory.cs`
exists purely so EF uses it instead; its connection string is never used.

---

## Key Patterns

### Event-Driven Messaging (Wolverine + RabbitMQ)

All inter-service events are defined as C# records in the `Contracts` project:
```csharp
// Contracts/QuestionCreated.cs
public record QuestionCreated(string QuestionId, string Title, string Content, DateTime Created, List<string> Tags);
```
Contracts: `QuestionCreated`, `QuestionUpdated`, `QuestionDeleted`, `AnswerCountUpdated`, `AnswerAccepted`.

**Publishing** (QuestionService — after DB save):
```csharp
await bus.PublishAsync(new QuestionCreated(question.Id, question.Title, ...));
```

**Handling** (SearchService — Wolverine convention, no interface needed):
```csharp
// SearchService/MessageHandlers/QuestionCreatedHandler.cs
public class QuestionCreatedHandler(ITypesenseClient client)
{
    public async Task HandleAsync(QuestionCreated message) { ... }
}
```

Wolverine is wired via `Common.WolverineExtensions.UseWolverineWithRabbitMqAsync()`:
- QuestionService **publishes all messages** to exchange `questions`
- SearchService **listens** on queue `question.search` bound to exchange `questions`

### Authentication (Keycloak JWT)

Apply to any service with `builder.Services.AddKeyCloakAuthentication()` (from `Common.AuthExtensions`). Configured for realm `MyStackOverflow`, audience `MyStackOverflow`. Valid issuers: localhost:6001, internal `keycloak` container name, and `id.MyStackOverflow.local`.

**A service using minimal APIs must also call `builder.Services.AddAuthorization()`
explicitly.** `AddControllers()` registers those services as a side effect, so
QuestionService gets them for free; ProfileService does not, and without it
`UseAuthorization()` throws at startup. This compiles cleanly and only fails at runtime.

Controller endpoints requiring auth:
```csharp
[Authorize]
[HttpPost]
public async Task<ActionResult<Question>> CreateQuestion(CreateQuestionDto dto) { ... }
```

Claim extraction pattern — services store the **id only**:
```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);   // the Keycloak `sub`
```
Do not denormalise the display name into other services. It used to live on
`Question.AskerDisplayName` / `Answer.UserDisplayName` and went stale the moment
someone renamed themselves; both columns were dropped. Names come from ProfileService.

Keycloak only emits a `name` claim once an account has both a first and a last name,
so anything reading it needs a `preferred_username` fallback.

### Stats, Votes and Reputation

**StatsService is event sourced.** It uses `WolverineFx.Marten`, so Postgres holds JSON
documents, not relational tables — there is no DbContext, no migrations, and document
tables (`mt_doc_*`) are created lazily on first write. Both documents are keyed
`something:yyyy-MM-dd` so a repeat write updates one row instead of adding another.

`Tag.UsageCount` (QuestionService) and trending tags (StatsService) are **different
numbers on purpose**: the first is an all-time total that only grows, the second a
rolling seven days. Likewise `Profile.Reputation` is a running total, while
`UserDailyReputation` is per-day movement — that is what makes "top this week"
answerable. Do not try to derive one from the other.

**A vote is final.** One row per `(UserId, TargetId)`, enforced by a unique index rather
than only an application check, since two simultaneous requests would both pass the
check. The client fetches existing votes and disables the controls; there is no toggle.

**Reputation is awarded by QuestionService, not VoteService — a deliberate departure
from the course.** The course's `CastVoteDto` carries `TargetUserId`, and VoteService
publishes the reputation event using that client-supplied value. Anyone signed in could
therefore POST `/votes` with their own id as `TargetUserId` and collect points on any
target; the one-vote-per-target rule only limits the rate.

Here `VoteCast` carries only who voted. `VoteCastHandler` in QuestionService reads the
author from its own database and publishes `UserReputationChanged` itself, so the client
cannot nominate who benefits. Self-votes move the tally but earn nothing.

The API ignores unknown JSON fields, so a client sending the course's five-field payload
still works — `TargetUserId` and `QuestionId` are simply dropped. If a later lecture
depends on the course's shape, that compatibility is why nothing breaks.

Point values live in the `Reputation` library because three services need them and
Contracts must stay free of policy.

### Message durability — and where it stops

QuestionService and VoteService publish through a **transactional outbox**
(`PersistMessagesWithPostgresql` + `UseEntityFrameworkCoreTransactions` +
`Policies.UseDurableOutboxOnAllSendingEndpoints`). The event is written to the service's
own database in the same transaction as the entity and forwarded once the broker is
reachable, so a broker outage no longer silently loses events.

**Configuration alone does not achieve this, and the failure is silent.**
`UseEntityFrameworkCoreTransactions()` auto-enlists Wolverine *message handlers* only.
A controller or minimal-API endpoint must take `IDbContextOutbox<TContext>`, use
`outbox.DbContext` as its context, publish through `outbox.PublishAsync`, and commit
with `outbox.SaveChangesAndFlushMessagesAsync()`. Injecting `IMessageBus` alongside a
`DbContext` compiles, creates the `wolverine_*` tables, and looks entirely correct while
giving no atomicity at all — the save and the publish are separate transactions. This
was shipped that way in Section 13 and caught in review afterwards.

`UpdateAnswer` still calls `db.SaveChangesAsync()` directly, which is right: it
publishes nothing.

Those two register their `DbContext` by hand rather than with `AddNpgsqlDbContext`,
because Wolverine's EF integration **requires the options to be a singleton**. The
trade-off is losing Aspire's DbContext health check. Do not "tidy" it back.

**The outbox does not make the stack broker-independent.** Verified on 2026-08-24: with
RabbitMQ stopped, a *running* service keeps serving requests, but a service that has to
**start** during the outage never comes up. `Common.WolverineExtensions` retries the
connection five times with exponential backoff and then lets the exception reach the
host. That is deliberate, but it means the outbox covers "the broker died while I was
running", not "the broker is missing when I boot".

### Pagination and sorting

`GET /questions` returns `PaginationResult<Question>`, never a bare array. Offset paging
lives in `Common/Pagination.cs`: default page size 5, hard maximum 50, values clamped
rather than rejected.

**Every sort appends `ThenBy(q => q.Id)`.** The seeded questions share a timestamp to
the second, and without a unique tiebreaker Postgres may order ties differently between
queries — which makes a row appear on two pages or on none. Keep the tiebreaker on any
new sort.

`sort` accepts `newest` (default), `active` and `unanswered`; anything else falls back
to newest, because the value comes from the address bar. **Answers are sorted in the web
app, not the API** — they are never paginated and EF cannot reliably order an included
collection. An accepted answer stays pinned to the top regardless of sort.

### Identity & Profiles (ProfileService)

`Profile` is keyed by the Keycloak `sub` — there is no separate user id column.

| Verb | Route | Auth |
|---|---|---|
| GET | `/profiles/{id}` | public, may 404 |
| GET | `/profiles/batch?ids=a,b,c` | public, **always 200** |
| POST | `/profiles/ensure` | `[Authorize]`, idempotent |
| PUT | `/profiles/me` | `[Authorize]`, caller's own only |

Reads are public because the question list already is: titles, bodies, tags and the
author id are visible to anyone, so hiding only the name would protect nothing while
401ing every anonymous render of `/questions`.

**The batch endpoint must never return 404.** `fetchClient` turns any 404 into Next's
`notFound()`, so a single author without a profile would take down a whole question
list. Unknown ids are simply absent from the array.

Profiles are created from the web app's `jwt` callback (`ensureProfile` in `src/auth.ts`)
because Keycloak publishes no events. That call is fire-and-forget by design — a
ProfileService outage must not block sign-in — but it checks `response.ok` explicitly,
since `fetch` only rejects on network errors and a silent 401 would surface as every
author on the site rendering "Unknown user" with nothing in the log.

**Authors are stitched on in `question-actions.ts`, not in pages.** Each read collects
the asker plus every answer author into a `Set`, makes one `/profiles/batch` call, and
attaches `author` to each question and answer. The API never returns `author`; the raw
wire shape is the local `RawQuestion` / `RawAnswer` type. Missing profiles fall back to
a placeholder rather than breaking the render. The lookup is cached under the
`profiles` tag and dropped with `updateTag` on edit, so a rename shows immediately.

### Frontend — Server Actions & Data Fetching

All backend calls go through `src/lib/fetchClient.ts` which:
- Reads `process.env.API_URL` (server-side only)
- Returns `{ data: T | null, error?: { message, status } }`
- Calls `notFound()` on 404, throws on 500

Server actions live in `src/lib/actions/` and are always marked `'use server'`. Pages call them directly:
```tsx
// Server Component page
const { data: questions, error } = await getQuestions(params?.tag);
if (error) throw error;
```

### Frontend — State Management

Global tag list is cached client-side in Zustand (`src/lib/useTagStore.ts`). Loaded once on app mount in `Providers.tsx`. Use `useTagStore` to look up tags by slug without re-fetching.

### Frontend — Route Protection

`src/proxy.ts` redirects signed-out visitors away from `/questions/ask`,
`/questions/:id/edit` and `/profiles/:id/edit`. **It is not the security boundary.**
Middleware cannot tell that a session's refresh token has died, and cannot know who
owns a question — the page-level `getValidSession()` and ownership checks still do
that work and must stay. Viewing a profile is deliberately public.

### Frontend — UI Components

Use **HeroUI React v3** (see the docs index below). Provider setup in `src/components/Providers.tsx`:
- `ThemeProvider` (next-themes, default light)
- `RouterProvider` (HeroUI + Next.js router integration)
- `ToastProvider` (bottom-end, max 5 visible)

The visual language is green (light) / purple (dark) on rounded cards. **Systematise it;
do not redesign it.** Three shared pieces own the repeated surfaces — reach for these
instead of pasting class chains:

- `components/layout/Panel.tsx` — `variant="header"` is the tinted page header,
  `variant="card"` the plain surface. Use `padded={false}` for edge-to-edge rows; a
  `p-0` passed through `className` would **not** win, since it has the same specificity
  as `p-6` and Tailwind emits it earlier in the stylesheet.
- `components/profiles/UserBadge.tsx` — every author byline.
- `components/tags/TagLink.tsx` and `lib/answerCountStyles.ts` — tag chips and the
  three-state answer tally colouring.

The React Compiler is enabled. It silently **skips** components it cannot memoize, so a
lint warning like "Compilation Skipped: Use of incompatible library" is a real problem,
not noise — it is what made the TipTap toolbar never render. Prefer `useWatch` over
react-hook-form's `watch()` for the same reason.

### Frontend — Image Uploads (Cloudinary)

Two folders, whitelisted in `lib/imageRules.ts`: `mystackoverflow/questions` and
`mystackoverflow/profiles`. `uploadImage` takes the target folder but validates it
against the whitelist, since it arrives from the browser. `deleteImage` refuses any
public id outside those folders, and `deleteImagesByUrl` is narrowed further to the
questions folder — it runs over user-authored markup, so someone who pasted another
member's avatar into a question must not delete it by deleting their own post.

### Typesense Search (SearchService)

Search endpoint (via gateway): `GET /search?query=...`

Tag filter syntax in query: `[tagslug] rest of query`, e.g., `[aspire] how to configure`.

Similar titles: `GET /search/similar-titles?query=...`

`SearchQuestion` document fields: `id`, `title`, `content` (HTML-stripped), `tags` (string[]), `createdAt` (Unix timestamp), `hasAcceptedAnswer`, `answerCount`.

Search hits are **not** questions — no author, no view count, and `tags` rather than
`tagSlugs`. The frontend models them as a separate `SearchResult` type; typing
`searchQuestions` as `Question[]` was a lie that only became dangerous once `Question`
gained a non-optional `author`.

Index is created at startup by `SearchService.Data.SearchInitializer.EnsureIndexExists()`.

### Tag Validation (QuestionService)

Tags are stored as `List<string>` slugs on `Question.TagSlugs`. Validation uses `[TagListValidator(1,5)]` (min 1, max 5 tags) and `TagService.AreTagsValidAsync()` which validates against DB tags cached in `IMemoryCache` for 2 hours.

Seeded tags (slugs): `aspire`, `keycloak`, `dotnet`, `ef-core`, `wolverine`, `postgresql`, `signalr`, `nextjs`, `typescript`, `microservices`.

---

## Infrastructure Notes

- **Aspire auto-generates** `infra/docker-compose.yaml` for production deployment — do not manually edit it.
- The **nginx-proxy** container (port 80) is only added in non-Development environments (`AppHost.cs`).
- Typesense API key is an Aspire secret parameter (`typesense-api-key`); accessed in SearchService via `builder.Configuration["typesense-api-key"]`.
- The Aspire dashboard is exposed on port 8080 in production compose, and auto-opened in dev mode.
- **The deployed stack is frozen at whatever `aspire deploy` last built.** It does not
  track the working tree, and it runs its own Postgres and Keycloak volumes with its own
  users. Testing current code means the dev stack, or a fresh deploy — never assume the
  running containers reflect the code in front of you.
- Dev and production Keycloak are **separate realms**. An account in one does not exist
  in the other.
---

<!-- HEROUI-REACT-AGENTS-MD-START -->
[HeroUI React v3 Docs Index]|root: ./.heroui-docs/react|STOP. What you remember about HeroUI React v3 is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: heroui agents-md --react --output AGENTS.md|.:{components\(buttons)\button-group.mdx,components\(buttons)\button.mdx,components\(buttons)\close-button.mdx,components\(buttons)\toggle-button-group.mdx,components\(buttons)\toggle-button.mdx,components\(collections)\dropdown.mdx,components\(collections)\list-box.mdx,components\(collections)\tag-group.mdx,components\(colors)\color-area.mdx,components\(colors)\color-field.mdx,components\(colors)\color-picker.mdx,components\(colors)\color-slider.mdx,components\(colors)\color-swatch-picker.mdx,components\(colors)\color-swatch.mdx,components\(controls)\slider.mdx,components\(controls)\switch.mdx,components\(data-display)\badge.mdx,components\(data-display)\chip.mdx,components\(data-display)\table.mdx,components\(date-and-time)\calendar.mdx,components\(date-and-time)\date-field.mdx,components\(date-and-time)\date-picker.mdx,components\(date-and-time)\date-range-picker.mdx,components\(date-and-time)\range-calendar.mdx,components\(date-and-time)\time-field.mdx,components\(feedback)\alert.mdx,components\(feedback)\meter.mdx,components\(feedback)\progress-bar.mdx,components\(feedback)\progress-circle.mdx,components\(feedback)\skeleton.mdx,components\(feedback)\spinner.mdx,components\(forms)\checkbox-group.mdx,components\(forms)\checkbox.mdx,components\(forms)\description.mdx,components\(forms)\error-message.mdx,components\(forms)\field-error.mdx,components\(forms)\fieldset.mdx,components\(forms)\form.mdx,components\(forms)\input-group.mdx,components\(forms)\input-otp.mdx,components\(forms)\input.mdx,components\(forms)\label.mdx,components\(forms)\number-field.mdx,components\(forms)\radio-group.mdx,components\(forms)\search-field.mdx,components\(forms)\text-area.mdx,components\(forms)\text-field.mdx,components\(layout)\card.mdx,components\(layout)\separator.mdx,components\(layout)\surface.mdx,components\(layout)\toolbar.mdx,components\(media)\avatar.mdx,components\(navigation)\accordion.mdx,components\(navigation)\breadcrumbs.mdx,components\(navigation)\disclosure-group.mdx,components\(navigation)\disclosure.mdx,components\(navigation)\link.mdx,components\(navigation)\pagination.mdx,components\(navigation)\tabs.mdx,components\(overlays)\alert-dialog.mdx,components\(overlays)\drawer.mdx,components\(overlays)\modal.mdx,components\(overlays)\popover.mdx,components\(overlays)\toast.mdx,components\(overlays)\tooltip.mdx,components\(pickers)\autocomplete.mdx,components\(pickers)\combo-box.mdx,components\(pickers)\select.mdx,components\(typography)\kbd.mdx,components\(typography)\text.mdx,components\(utilities)\scroll-shadow.mdx,components\index.mdx,getting-started\(handbook)\animation.mdx,getting-started\(handbook)\colors.mdx,getting-started\(handbook)\composition.mdx,getting-started\(handbook)\styling.mdx,getting-started\(handbook)\theming.mdx,getting-started\(overview)\cli.mdx,getting-started\(overview)\design-principles.mdx,getting-started\(overview)\frameworks.mdx,getting-started\(overview)\quick-start.mdx,getting-started\(ui-for-agents)\agent-skills.mdx,getting-started\(ui-for-agents)\agents-md.mdx,getting-started\(ui-for-agents)\llms-txt.mdx,getting-started\(ui-for-agents)\mcp-server.mdx,getting-started\index.mdx,releases\index.mdx,releases\v3-0-0-alpha-32.mdx,releases\v3-0-0-alpha-33.mdx,releases\v3-0-0-alpha-34.mdx,releases\v3-0-0-alpha-35.mdx,releases\v3-0-0-beta-1.mdx,releases\v3-0-0-beta-2.mdx,releases\v3-0-0-beta-3.mdx,releases\v3-0-0-beta-4.mdx,releases\v3-0-0-beta-6.mdx,releases\v3-0-0-beta-7.mdx,releases\v3-0-0-beta-8.mdx,releases\v3-0-0-rc-1.mdx,releases\v3-0-0.mdx,releases\v3-0-2.mdx,releases\v3-0-3.mdx,releases\v3-0-4.mdx}|demos/.:{accordion\basic.tsx,accordion\controlled.tsx,accordion\custom-indicator.tsx,accordion\custom-render-function.tsx,accordion\custom-styles.tsx,accordion\disabled.tsx,accordion\faq.tsx,accordion\multiple.tsx,accordion\surface.tsx,accordion\without-separator.tsx,alert-dialog\backdrop-variants.tsx,alert-dialog\close-methods.tsx,alert-dialog\controlled.tsx,alert-dialog\custom-animations.tsx,alert-dialog\custom-backdrop.tsx,alert-dialog\custom-icon.tsx,alert-dialog\custom-portal.tsx,alert-dialog\custom-trigger.tsx,alert-dialog\default.tsx,alert-dialog\dismiss-behavior.tsx,alert-dialog\placements.tsx,alert-dialog\sizes.tsx,alert-dialog\statuses.tsx,alert-dialog\with-close-button.tsx,alert\basic.tsx,autocomplete\allows-empty-collection.tsx,autocomplete\asynchronous-filtering.tsx,autocomplete\controlled-open-state.tsx,autocomplete\controlled.tsx,autocomplete\custom-indicator.tsx,autocomplete\default.tsx,autocomplete\disabled.tsx,autocomplete\email-recipients.tsx,autocomplete\full-width.tsx,autocomplete\location-search.tsx,autocomplete\multiple-select.tsx,autocomplete\required.tsx,autocomplete\single-select.tsx,autocomplete\tag-group-selection.tsx,autocomplete\user-selection-multiple.tsx,autocomplete\user-selection.tsx,autocomplete\variants.tsx,autocomplete\with-description.tsx,autocomplete\with-disabled-options.tsx,autocomplete\with-sections.tsx,avatar\basic.tsx,avatar\colors.tsx,avatar\custom-styles.tsx,avatar\fallback.tsx,avatar\group.tsx,avatar\sizes.tsx,avatar\variants.tsx,badge\basic.tsx,badge\colors.tsx,badge\dot.tsx,badge\placements.tsx,badge\sizes.tsx,badge\variants.tsx,badge\with-content.tsx,breadcrumbs\basic.tsx,breadcrumbs\custom-render-function.tsx,breadcrumbs\custom-separator.tsx,breadcrumbs\disabled.tsx,breadcrumbs\level-2.tsx,breadcrumbs\level-3.tsx,button-group\basic.tsx,button-group\disabled.tsx,button-group\full-width.tsx,button-group\orientation.tsx,button-group\sizes.tsx,button-group\variants.tsx,button-group\with-icons.tsx,button-group\without-separator.tsx,button\basic.tsx,button\custom-render-function.tsx,button\custom-variants.tsx,button\disabled.tsx,button\full-width.tsx,button\icon-only.tsx,button\loading-state.tsx,button\loading.tsx,button\outline-variant.tsx,button\ripple-effect.tsx,button\sizes.tsx,button\social.tsx,button\variants.tsx,button\with-icons.tsx,calendar\basic.tsx,calendar\booking-calendar.tsx,calendar\controlled.tsx,calendar\custom-icons.tsx,calendar\custom-styles.tsx,calendar\default-value.tsx,calendar\disabled.tsx,calendar\focused-value.tsx,calendar\international-calendar.tsx,calendar\min-max-dates.tsx,calendar\multiple-months.tsx,calendar\read-only.tsx,calendar\unavailable-dates.tsx,calendar\with-indicators.tsx,calendar\year-picker.tsx,card\default.tsx,card\horizontal.tsx,card\variants.tsx,card\with-avatar.tsx,card\with-form.tsx,card\with-images.tsx,checkbox-group\basic.tsx,checkbox-group\controlled.tsx,checkbox-group\custom-render-function.tsx,checkbox-group\disabled.tsx,checkbox-group\features-and-addons.tsx,checkbox-group\indeterminate.tsx,checkbox-group\on-surface.tsx,checkbox-group\validation.tsx,checkbox-group\with-custom-indicator.tsx,checkbox\basic.tsx,checkbox\controlled.tsx,checkbox\custom-indicator.tsx,checkbox\custom-render-function.tsx,checkbox\custom-styles.tsx,checkbox\default-selected.tsx,checkbox\disabled.tsx,checkbox\form.tsx,checkbox\full-rounded.tsx,checkbox\indeterminate.tsx,checkbox\invalid.tsx,checkbox\render-props.tsx,checkbox\variants.tsx,checkbox\with-description.tsx,checkbox\with-label.tsx,chip\basic.tsx,chip\statuses.tsx,chip\variants.tsx,chip\with-icon.tsx,close-button\default.tsx,close-button\interactive.tsx,close-button\variants.tsx,close-button\with-custom-icon.tsx,color-area\basic.tsx,color-area\controlled.tsx,color-area\custom-render-function.tsx,color-area\disabled.tsx,color-area\space-and-channels.tsx,color-area\with-dots.tsx,color-field\basic.tsx,color-field\channel-editing.tsx,color-field\controlled.tsx,color-field\custom-render-function.tsx,color-field\disabled.tsx,color-field\form-example.tsx,color-field\full-width.tsx,color-field\invalid.tsx,color-field\on-surface.tsx,color-field\required.tsx,color-field\variants.tsx,color-field\with-description.tsx,color-picker\basic.tsx,color-picker\controlled.tsx,color-picker\with-fields.tsx,color-picker\with-sliders.tsx,color-picker\with-swatches.tsx,color-slider\alpha-channel.tsx,color-slider\basic.tsx,color-slider\channels.tsx,color-slider\controlled.tsx,color-slider\custom-render-function.tsx,color-slider\disabled.tsx,color-slider\rgb-channels.tsx,color-slider\vertical.tsx,color-swatch-picker\basic.tsx,color-swatch-picker\controlled.tsx,color-swatch-picker\custom-indicator.tsx,color-swatch-picker\custom-render-function.tsx,color-swatch-picker\default-value.tsx,color-swatch-picker\disabled.tsx,color-swatch-picker\sizes.tsx,color-swatch-picker\stack-layout.tsx,color-swatch-picker\variants.tsx,color-swatch\accessibility.tsx,color-swatch\basic.tsx,color-swatch\custom-render-function.tsx,color-swatch\custom-styles.tsx,color-swatch\shapes.tsx,color-swatch\sizes.tsx,color-swatch\transparency.tsx,combo-box\allows-custom-value.tsx,combo-box\asynchronous-loading.tsx,combo-box\controlled-input-value.tsx,combo-box\controlled.tsx,combo-box\custom-filtering.tsx,combo-box\custom-indicator.tsx,combo-box\custom-render-function.tsx,combo-box\custom-value.tsx,combo-box\default-selected-key.tsx,combo-box\default.tsx,combo-box\disabled.tsx,combo-box\full-width.tsx,combo-box\menu-trigger.tsx,combo-box\on-surface.tsx,combo-box\required.tsx,combo-box\with-description.tsx,combo-box\with-disabled-options.tsx,combo-box\with-sections.tsx,date-field\basic.tsx,date-field\controlled.tsx,date-field\custom-render-function.tsx,date-field\disabled.tsx,date-field\form-example.tsx,date-field\full-width.tsx,date-field\granularity.tsx,date-field\invalid.tsx,date-field\on-surface.tsx,date-field\required.tsx,date-field\variants.tsx,date-field\with-description.tsx,date-field\with-prefix-and-suffix.tsx,date-field\with-prefix-icon.tsx,date-field\with-suffix-icon.tsx,date-field\with-validation.tsx,date-picker\basic.tsx,date-picker\controlled.tsx,date-picker\custom-render-function.tsx,date-picker\disabled.tsx,date-picker\form-example.tsx,date-picker\format-options-no-ssr.tsx,date-picker\format-options.tsx,date-picker\international-calendar.tsx,date-picker\with-custom-indicator.tsx,date-picker\with-validation.tsx,date-range-picker\basic.tsx,date-range-picker\controlled.tsx,date-range-picker\custom-render-function.tsx,date-range-picker\disabled.tsx,date-range-picker\form-example.tsx,date-range-picker\format-options-no-ssr.tsx,date-range-picker\format-options.tsx,date-range-picker\input-container.tsx,date-range-picker\international-calendar.tsx,date-range-picker\with-custom-indicator.tsx,date-range-picker\with-validation.tsx,description\basic.tsx,disclosure-group\basic.tsx,disclosure-group\controlled.tsx,disclosure\basic.tsx,disclosure\custom-render-function.tsx,drawer\backdrop-variants.tsx,drawer\basic.tsx,drawer\controlled.tsx,drawer\navigation.tsx,drawer\non-dismissable.tsx,drawer\placements.tsx,drawer\scrollable-content.tsx,drawer\with-form.tsx,dropdown\controlled-open-state.tsx,dropdown\controlled.tsx,dropdown\custom-trigger.tsx,dropdown\default.tsx,dropdown\long-press-trigger.tsx,dropdown\single-with-custom-indicator.tsx,dropdown\with-custom-submenu-indicator.tsx,dropdown\with-descriptions.tsx,dropdown\with-disabled-items.tsx,dropdown\with-icons.tsx,dropdown\with-keyboard-shortcuts.tsx,dropdown\with-multiple-selection.tsx,dropdown\with-section-level-selection.tsx,dropdown\with-sections.tsx,dropdown\with-single-selection.tsx,dropdown\with-submenus.tsx,error-message\basic.tsx,error-message\with-tag-group.tsx,field-error\basic.tsx,fieldset\basic.tsx,fieldset\on-surface.tsx,form\basic.tsx,form\custom-render-function.tsx,input-group\default.tsx,input-group\disabled.tsx,input-group\full-width.tsx,input-group\invalid.tsx,input-group\on-surface.tsx,input-group\password-with-toggle.tsx,input-group\required.tsx,input-group\variants.tsx,input-group\with-badge-suffix.tsx,input-group\with-copy-suffix.tsx,input-group\with-icon-prefix-and-copy-suffix.tsx,input-group\with-icon-prefix-and-text-suffix.tsx,input-group\with-keyboard-shortcut.tsx,input-group\with-loading-suffix.tsx,input-group\with-prefix-and-suffix.tsx,input-group\with-prefix-icon.tsx,input-group\with-suffix-icon.tsx,input-group\with-text-prefix.tsx,input-group\with-text-suffix.tsx,input-group\with-textarea.tsx,input-otp\basic.tsx,input-otp\controlled.tsx,input-otp\disabled.tsx,input-otp\form-example.tsx,input-otp\four-digits.tsx,input-otp\on-complete.tsx,input-otp\on-surface.tsx,input-otp\variants.tsx,input-otp\with-pattern.tsx,input-otp\with-validation.tsx,input\basic.tsx,input\controlled.tsx,input\full-width.tsx,input\on-surface.tsx,input\types.tsx,input\variants.tsx,kbd\basic.tsx,kbd\inline.tsx,kbd\instructional.tsx,kbd\navigation.tsx,kbd\special.tsx,kbd\variants.tsx,label\basic.tsx,link\basic.tsx,link\custom-icon.tsx,link\custom-render-function.tsx,link\icon-placement.tsx,link\underline-and-offset.tsx,link\underline-offset.tsx,link\underline-variants.tsx,list-box\controlled.tsx,list-box\custom-check-icon.tsx,list-box\custom-render-function.tsx,list-box\default.tsx,list-box\multi-select.tsx,list-box\virtualization.tsx,list-box\with-disabled-items.tsx,list-box\with-sections.tsx,meter\basic.tsx,meter\colors.tsx,meter\custom-value.tsx,meter\sizes.tsx,meter\without-label.tsx,modal\backdrop-variants.tsx,modal\close-methods.tsx,modal\controlled.tsx,modal\custom-animations.tsx,modal\custom-backdrop.tsx,modal\custom-portal.tsx,modal\custom-trigger.tsx,modal\default.tsx,modal\dismiss-behavior.tsx,modal\placements.tsx,modal\scroll-comparison.tsx,modal\sizes.tsx,modal\with-form.tsx,number-field\basic.tsx,number-field\controlled.tsx,number-field\custom-icons.tsx,number-field\custom-render-function.tsx,number-field\disabled.tsx,number-field\form-example.tsx,number-field\full-width.tsx,number-field\on-surface.tsx,number-field\required.tsx,number-field\validation.tsx,number-field\variants.tsx,number-field\with-chevrons.tsx,number-field\with-description.tsx,number-field\with-format-options.tsx,number-field\with-step.tsx,number-field\with-validation.tsx,pagination\basic.tsx,pagination\controlled.tsx,pagination\custom-icons.tsx,pagination\disabled.tsx,pagination\simple-prev-next.tsx,pagination\sizes.tsx,pagination\with-ellipsis.tsx,pagination\with-summary.tsx,popover\basic.tsx,popover\custom-render-function.tsx,popover\interactive.tsx,popover\placement.tsx,popover\with-arrow.tsx,progress-bar\basic.tsx,progress-bar\colors.tsx,progress-bar\custom-value.tsx,progress-bar\indeterminate.tsx,progress-bar\sizes.tsx,progress-bar\without-label.tsx,progress-circle\basic.tsx,progress-circle\colors.tsx,progress-circle\custom-svg.tsx,progress-circle\indeterminate.tsx,progress-circle\sizes.tsx,progress-circle\with-label.tsx,radio-group\basic.tsx,radio-group\controlled.tsx,radio-group\custom-indicator.tsx,radio-group\custom-render-function.tsx,radio-group\delivery-and-payment.tsx,radio-group\disabled.tsx,radio-group\horizontal.tsx,radio-group\on-surface.tsx,radio-group\uncontrolled.tsx,radio-group\validation.tsx,radio-group\variants.tsx,range-calendar\allows-non-contiguous-ranges.tsx,range-calendar\basic.tsx,range-calendar\booking-calendar.tsx,range-calendar\controlled.tsx,range-calendar\default-value.tsx,range-calendar\disabled.tsx,range-calendar\focused-value.tsx,range-calendar\international-calendar.tsx,range-calendar\invalid.tsx,range-calendar\min-max-dates.tsx,range-calendar\multiple-months.tsx,range-calendar\read-only.tsx,range-calendar\three-months.tsx,range-calendar\unavailable-dates.tsx,range-calendar\with-indicators.tsx,range-calendar\year-picker.tsx,scroll-shadow\custom-size.tsx,scroll-shadow\default.tsx,scroll-shadow\hide-scroll-bar.tsx,scroll-shadow\orientation.tsx,scroll-shadow\visibility-change.tsx,scroll-shadow\with-card.tsx,search-field\basic.tsx,search-field\controlled.tsx,search-field\custom-icons.tsx,search-field\custom-render-function.tsx,search-field\disabled.tsx,search-field\form-example.tsx,search-field\full-width.tsx,search-field\on-surface.tsx,search-field\required.tsx,search-field\validation.tsx,search-field\variants.tsx,search-field\with-description.tsx,search-field\with-keyboard-shortcut.tsx,search-field\with-validation.tsx,select\asynchronous-loading.tsx,select\controlled-multiple.tsx,select\controlled-open-state.tsx,select\controlled.tsx,select\custom-indicator.tsx,select\custom-render-function.tsx,select\custom-value-multiple.tsx,select\custom-value.tsx,select\default.tsx,select\disabled.tsx,select\full-width.tsx,select\multiple-select.tsx,select\on-surface.tsx,select\required.tsx,select\variants.tsx,select\with-description.tsx,select\with-disabled-options.tsx,select\with-sections.tsx,separator\basic.tsx,separator\custom-render-function.tsx,separator\manual-variant-override.tsx,separator\variants.tsx,separator\vertical.tsx,separator\with-content.tsx,separator\with-surface.tsx,skeleton\animation-types.tsx,skeleton\basic.tsx,skeleton\card.tsx,skeleton\grid.tsx,skeleton\list.tsx,skeleton\single-shimmer.tsx,skeleton\text-content.tsx,skeleton\user-profile.tsx,slider\custom-render-function.tsx,slider\default.tsx,slider\disabled.tsx,slider\range.tsx,slider\vertical.tsx,spinner\basic.tsx,spinner\colors.tsx,spinner\sizes.tsx,surface\variants.tsx,switch\basic.tsx,switch\controlled.tsx,switch\custom-render-function.tsx,switch\custom-styles.tsx,switch\default-selected.tsx,switch\disabled.tsx,switch\form.tsx,switch\group-horizontal.tsx,switch\group.tsx,switch\label-position.tsx,switch\render-props.tsx,switch\sizes.tsx,switch\with-description.tsx,switch\with-icons.tsx,switch\without-label.tsx,table\async-loading.tsx,table\basic.tsx,table\column-resizing.tsx,table\custom-cells.tsx,table\empty-state.tsx,table\expandable-rows.tsx,table\pagination.tsx,table\secondary-variant.tsx,table\selection.tsx,table\sorting.tsx,table\tanstack-table.tsx,table\virtualization.tsx,tabs\basic.tsx,tabs\custom-render-function.tsx,tabs\custom-styles.tsx,tabs\disabled.tsx,tabs\secondary-vertical.tsx,tabs\secondary.tsx,tabs\vertical.tsx,tabs\with-separator.tsx,tag-group\basic.tsx,tag-group\controlled.tsx,tag-group\custom-render-function.tsx,tag-group\disabled.tsx,tag-group\selection-modes.tsx,tag-group\sizes.tsx,tag-group\variants.tsx,tag-group\with-error-message.tsx,tag-group\with-list-data.tsx,tag-group\with-prefix.tsx,tag-group\with-remove-button.tsx,text\default.tsx,text\primitives.tsx,text\prose.tsx,text\render-props.tsx,text\typography-scale.tsx,textarea\basic.tsx,textarea\controlled.tsx,textarea\full-width.tsx,textarea\on-surface.tsx,textarea\rows.tsx,textarea\variants.tsx,textfield\basic.tsx,textfield\controlled.tsx,textfield\custom-render-function.tsx,textfield\disabled.tsx,textfield\full-width.tsx,textfield\input-types.tsx,textfield\on-surface.tsx,textfield\required.tsx,textfield\textarea.tsx,textfield\validation.tsx,textfield\with-description.tsx,textfield\with-error.tsx,time-field\basic.tsx,time-field\controlled.tsx,time-field\custom-render-function.tsx,time-field\disabled.tsx,time-field\form-example.tsx,time-field\full-width.tsx,time-field\invalid.tsx,time-field\on-surface.tsx,time-field\required.tsx,time-field\with-description.tsx,time-field\with-prefix-and-suffix.tsx,time-field\with-prefix-icon.tsx,time-field\with-suffix-icon.tsx,time-field\with-validation.tsx,toast\callbacks.tsx,toast\custom-indicator.tsx,toast\custom-queue.tsx,toast\custom-toast.tsx,toast\default.tsx,toast\placements.tsx,toast\promise.tsx,toast\simple.tsx,toast\variants.tsx,toggle-button-group\attached.tsx,toggle-button-group\basic.tsx,toggle-button-group\controlled.tsx,toggle-button-group\disabled.tsx,toggle-button-group\full-width.tsx,toggle-button-group\orientation.tsx,toggle-button-group\selection-mode.tsx,toggle-button-group\sizes.tsx,toggle-button-group\without-separator.tsx,toggle-button\basic.tsx,toggle-button\controlled.tsx,toggle-button\disabled.tsx,toggle-button\icon-only.tsx,toggle-button\sizes.tsx,toggle-button\variants.tsx,toolbar\basic.tsx,toolbar\custom-styles.tsx,toolbar\vertical.tsx,toolbar\with-button-group.tsx,tooltip\basic.tsx,tooltip\custom-render-function.tsx,tooltip\custom-trigger.tsx,tooltip\placement.tsx,tooltip\with-arrow.tsx}
<!-- HEROUI-REACT-AGENTS-MD-END -->
