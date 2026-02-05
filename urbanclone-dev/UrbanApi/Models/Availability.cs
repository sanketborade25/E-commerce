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

        public Professional Professional { get; set; } = null!;
    }
}
