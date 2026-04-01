using System;

namespace UrbanApi.Models
{
    public class Availability : BaseEntity
    {
        public int Id { get; set; }
        public Guid ProfessionalId { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsRecurring { get; set; } = false; // basic flag, extend later

        // New Fields
        public string Status { get; set; } = "available"; // available, booked, etc.
        public DateTime Date { get; set; } // Explicit date for grouping

        public Professional Professional { get; set; } = null!;
    }
}
