using System;
using System.Collections.Generic;

namespace UrbanApi.Models
{
    public class Booking : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string BookingReference { get; set; } = null!;
        public string Status { get; set; } = "Pending";
        public DateTime ScheduledAt { get; set; }
        public int? AddressId { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";

        // Navigation
        public User User { get; set; } = null!;
        public Professional? Professional { get; set; }
        public Address? Address { get; set; }
        public ICollection<BookingItem> Items { get; set; } = new List<BookingItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
