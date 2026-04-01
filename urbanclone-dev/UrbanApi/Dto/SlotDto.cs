using System;

namespace UrbanApi.Dto
{
    public class SlotDto
    {
        public int AvailabilityId { get; set; }
        public Guid ProfessionalId { get; set; }
        public DateTime Date { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public string Status { get; set; } = "available";
    }

    public class SlotReservationResult
    {
        public bool Success { get; set; }
        public int? AvailabilityId { get; set; }
        public string Message { get; set; } = "";
    }
}
