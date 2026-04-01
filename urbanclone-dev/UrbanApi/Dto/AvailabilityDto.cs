using System;

namespace UrbanApi.Dto
{
    public class AvailabilityDto
    {
        public int Id { get; set; }
        public Guid ProfessionalId { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsRecurring { get; set; }

        // New Fields
        public string Status { get; set; } = "available";
        public DateTime Date { get; set; }
    }

    public class AvailabilityCreateDto
    {
        public Guid ProfessionalId { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsRecurring { get; set; }

        // New Fields
        public string Status { get; set; } = "available";
        public DateTime Date { get; set; }
    }
}
