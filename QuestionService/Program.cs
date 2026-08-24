using System.Net.Sockets;
using Common;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Polly;
using QuestionService.Data;
using QuestionService.Services;
using RabbitMQ.Client;
using RabbitMQ.Client.Exceptions;
using Wolverine;
using Wolverine.EntityFrameworkCore;
using Wolverine.Postgresql;
using Wolverine.RabbitMQ;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.AddServiceDefaults();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<TagService>();
builder.Services.AddKeyCloakAuthentication();

var connectionString = builder.Configuration.GetConnectionString("questionDb")
                       ?? throw new InvalidOperationException("questionDb connection string not found");

// Registered by hand rather than with AddNpgsqlDbContext because Wolverine's EF
// integration requires the *options* to be a singleton, and its documentation is
// emphatic about it. The trade-off is losing Aspire's DbContext health check.
builder.Services.AddDbContext<QuestionDbContext>(
    options => options.UseNpgsql(connectionString),
    optionsLifetime: ServiceLifetime.Singleton);

await builder.UseWolverineWithRabbitMqAsync(opts =>
{
    opts.PublishAllMessages().ToRabbitExchange("questions");
    // This service now consumes as well as publishes: votes are cast elsewhere but
    // the tally lives here. Named for what it consumes rather than for the service,
    // since the other queues already read as question.<consumer>.
    opts.ListenToRabbitQueue("question.votes", cfg => cfg.BindExchange("questions"));

    // Transactional outbox. Without it, a question saved while RabbitMQ is down keeps
    // its row but loses its event forever - the search index never learns about it.
    // The message is now written to questionDb in the same transaction and forwarded
    // by a background process once the broker is reachable.
    opts.PersistMessagesWithPostgresql(connectionString);
    opts.UseEntityFrameworkCoreTransactions();
    opts.Policies.UseDurableOutboxOnAllSendingEndpoints();

    opts.ApplicationAssembly = typeof(Program).Assembly;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapDefaultEndpoints();

await app.MigrateDatabaseAsync<QuestionDbContext>();

app.Run();