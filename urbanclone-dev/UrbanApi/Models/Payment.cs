using System;

namespace UrbanApi.Models
{
    public class Payment : BaseEntity
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public string? Provider { get; set; }
        public string? ProviderPaymentId { get; set; }
        public decimal Amount { get; set; }
        public string? Status { get; set; }

        public Booking Booking { get; set; } = null!;
    }
}
