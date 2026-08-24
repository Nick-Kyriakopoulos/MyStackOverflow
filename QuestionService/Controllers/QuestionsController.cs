using System.Security.Claims;
using Contracts;
using FastExpressionCompiler;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestionService.Data;
using QuestionService.DTOs;
using QuestionService.Models;
using QuestionService.Services;
using Reputation;
using Wolverine;

namespace QuestionService.Controllers;

[ApiController]
[Route("[controller]")]
public class QuestionsController(QuestionDbContext db, IMessageBus bus, TagService tagService) : ControllerBase
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Question>> CreateQuestion(CreateQuestionDto dto)
    {
        if (!await tagService.AreTagsValidAsync(dto.Tags)) return BadRequest("Invalid tags");
        
        var userId= User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null) return BadRequest("Cannot get user details!");

        var question = new Question
        {
            Title = dto.Title,
            Content = dto.Content,
            TagSlugs = dto.Tags,
            AskerId = userId
        };
        
        db.Questions.Add(question);
        await db.SaveChangesAsync();

        // Deliberately after the save and outside its transaction: the question is the
        // part that must not be lost, and a tag counter that drifts by one is cheap.
        await db.Tags.Where(t => dto.Tags.Contains(t.Slug))
            .ExecuteUpdateAsync(x => x.SetProperty(t => t.UsageCount, t => t.UsageCount + 1));

        await bus.PublishAsync(new QuestionCreated(
            question.Id, question.Title,
            question.Content, question.CreatedAt,
            question.TagSlugs
        )); 
        
        return Created($"/questions/{question.Id}", question);
    }
    
    [HttpGet]
    public async Task<ActionResult<List<Question>>> GetQuestions(string? tag)
    {
        var query = db.Questions.AsQueryable();

        if (!string.IsNullOrEmpty(tag))
        {
            query = query.Where(q => q.TagSlugs.Contains(tag));
        }
        
        return await query.OrderByDescending(q => q.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Question>> GetQuestion(string id)
    {
        var question = await db.Questions
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.Id == id);
        
        if (question == null) return NotFound();
        
        await db.Questions.Where(x => x.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ViewCount, x => x.ViewCount + 1));
        
        return question;
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateQuestion(string id, CreateQuestionDto dto)
    {
        var question = await db.Questions.FindAsync(id);
        if (question == null) return NotFound();
        
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId!= question.AskerId) return Forbid();
        
        if (!await tagService.AreTagsValidAsync(dto.Tags)) return BadRequest("Invalid tags");

        // Captured before the overwrite, so the counters can be corrected for tags the
        // user added or dropped during the edit.
        var original = question.TagSlugs.ToArray();
        var removed = original.Except(dto.Tags, StringComparer.OrdinalIgnoreCase).ToArray();
        var added = dto.Tags.Except(original, StringComparer.OrdinalIgnoreCase).ToArray();

        question.Title = dto.Title;
        question.Content = dto.Content;
        question.TagSlugs = dto.Tags;
        question.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        if (removed.Length > 0)
        {
            // Guarded against going negative: the counter is maintained outside the
            // question transaction, so it can drift, and a negative usage count would
            // be visible on the tags page.
            await db.Tags.Where(t => removed.Contains(t.Slug) && t.UsageCount > 0)
                .ExecuteUpdateAsync(x => x.SetProperty(t => t.UsageCount, t => t.UsageCount - 1));
        }

        if (added.Length > 0)
        {
            await db.Tags.Where(t => added.Contains(t.Slug))
                .ExecuteUpdateAsync(x => x.SetProperty(t => t.UsageCount, t => t.UsageCount + 1));
        }

        await bus.PublishAsync(new QuestionUpdated(question.Id, question.Title,
            question.Content, question.TagSlugs.AsArray()));
        
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteQuestion(string id)
    {
        var question = await db.Questions.FindAsync(id);
        if (question == null) return NotFound();
        
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != question.AskerId) return Forbid();
        
        var tags = question.TagSlugs.ToArray();

        db.Questions.Remove(question);
        await db.SaveChangesAsync();

        await db.Tags.Where(t => tags.Contains(t.Slug) && t.UsageCount > 0)
            .ExecuteUpdateAsync(x => x.SetProperty(t => t.UsageCount, t => t.UsageCount - 1));

        await bus.PublishAsync(new QuestionDeleted(question.Id));
        
        return NoContent();
    }
    
    [Authorize]
    [HttpPost("{questionId}/answers")]
    public async Task<ActionResult> PostAnswer(string questionId, CreateAnswerDto dto)
    {
        var question = await db.Questions.FindAsync(questionId);
        if (question is null) return NotFound();
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return BadRequest("Cannot get user details");

        var answer = new Answer
        {
            Content = dto.Content,
            UserId = userId,
            QuestionId = questionId
        };
        
        question.Answers.Add(answer);
        question.AnswerCount++;
        
        await db.SaveChangesAsync();
        
        await bus.PublishAsync(new AnswerCountUpdated(questionId, question.AnswerCount));
        
        return Created($"/questions/{questionId}", answer);
    }
    
    [Authorize]
    [HttpPut("{questionId}/answers/{answerId}")]
    public async Task<ActionResult> UpdateAnswer(string questionId, string answerId, CreateAnswerDto dto)
    {
        var answer = await db.Answers.FindAsync(answerId);
        if (answer is null) return NotFound();
        if (answer.QuestionId != questionId) return BadRequest("Cannot update answer details");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != answer.UserId) return Forbid();

        answer.Content = dto.Content;
        answer.UpdatedAt = DateTime.UtcNow;
        
        await db.SaveChangesAsync();
        return NoContent();
    }
    
    [Authorize]
    [HttpDelete("{questionId}/answers/{answerId}")]
    public async Task<ActionResult> DeleteAnswer(string questionId, string answerId)
    {
        var answer = await db.Answers.FindAsync(answerId);
        var question = await db.Questions.FindAsync(questionId);
        if (answer is null || question is null) return NotFound();
        if (answer.QuestionId != questionId || answer.Accepted) return BadRequest("Cannot delete this answer");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != answer.UserId) return Forbid();

        db.Answers.Remove(answer);
        question.AnswerCount--;
        
        await db.SaveChangesAsync();
        
        await bus.PublishAsync(new AnswerCountUpdated(questionId, question.AnswerCount));
        
        return NoContent();
    }
    
    [Authorize]
    [HttpPost("{questionId}/answers/{answerId}/accept")]
    public async Task<ActionResult> AcceptAnswer(string questionId, string answerId)
    {
        var answer = await db.Answers.FindAsync(answerId);
        var question = await db.Questions.FindAsync(questionId);
        if (answer is null || question is null) return NotFound();
        if (answer.QuestionId != questionId || question.HasAcceptedAnswer) return BadRequest("Cannot accept answer");
        
        var actorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (actorId is null) return BadRequest("Cannot get user details");
        if (actorId != question.AskerId) return Forbid();

        answer.Accepted = true;
        question.HasAcceptedAnswer = true;

        await db.SaveChangesAsync();

        await bus.PublishAsync(new AnswerAccepted(questionId));

        // The answer's author earns the reputation, not whoever accepted it.
        await bus.PublishAsync(
            ReputationHelper.MakeEvent(answer.UserId, ReputationReason.AnswerAccepted, actorId));
        
        return NoContent();
    }
}