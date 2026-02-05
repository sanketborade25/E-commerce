using System;

namespace UrbanApi.Dto
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string Title { get; set; } = null!;
        public string? Message { get; set; }
        public bool IsRead { get; set; }
    }

    public class NotificationCreateDto
    {
        public Guid? UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string Title { get; set; } = null!;
        public string? Message { get; set; }
    }
}
