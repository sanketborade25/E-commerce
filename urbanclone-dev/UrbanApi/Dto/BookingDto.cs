using System;
using System.Collections.Generic;

namespace UrbanApi.Dto
{
    public class BookingDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string BookingReference { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime ScheduledAt { get; set; }
        public int? AddressId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public List<BookingItemDto> Items { get; set; } = new();
    }

    public class BookingCreateDto
    {
        public Guid UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public DateTime ScheduledAt { get; set; }
        public int? AddressId { get; set; }
        public List<BookingItemCreateDto> Items { get; set; } = new();
    }
}
