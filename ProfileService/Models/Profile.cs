using System.ComponentModel.DataAnnotations;

namespace ProfileService.Models;

public class Profile
{
    // Keycloak's "sub" claim is the id - profiles are created from a token, never
    // registered separately, so there is no second key to keep in sync.
    [MaxLength(36)] public string Id { get; set; } = Guid.NewGuid().ToString();
    [MaxLength(300)] public required string DisplayName { get; set; }
    [MaxLength(500)] public string? ImageUrl { get; set; }
    public int Reputation { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
