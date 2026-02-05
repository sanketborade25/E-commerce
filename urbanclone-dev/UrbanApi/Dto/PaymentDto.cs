using System;

namespace UrbanApi.Dto
{
    public class PaymentDto
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public string? Provider { get; set; }
        public string? ProviderPaymentId { get; set; }
        public decimal Amount { get; set; }
        public string? Status { get; set; }
    }

    public class PaymentCreateDto
    {
        public Guid BookingId { get; set; }
        public string? Provider { get; set; }
        public string? ProviderPaymentId { get; set; }
        public decimal Amount { get; set; }
    }
}
