using System;

namespace UrbanApi.Models
{
    public class Notification : BaseEntity
    {
        public int Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string Title { get; set; } = null!;
        public string? Message { get; set; }
        public bool IsRead { get; set; } = false;

        public User? User { get; set; }
        public Professional? Professional { get; set; }
    }
}
