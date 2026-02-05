using System;

namespace UrbanApi.Models
{
    public class Review : BaseEntity
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public Guid ProfessionalId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; } // 1..5
        public string? Comment { get; set; }

        public Booking Booking { get; set; } = null!;
        public Professional Professional { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}

