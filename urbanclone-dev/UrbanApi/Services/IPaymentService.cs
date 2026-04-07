using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Services
{
    /// <summary>
    /// Service interface for payment processing operations.
    /// Handles payment simulation, validation, and status updates.
    /// </summary>
    public interface IPaymentService
    {
        /// <summary>
        /// Process a payment for a booking.
        /// Validates booking exists, prevents duplicate payments, simulates payment.
        /// </summary>
        Task<PaymentResponseDto> ProcessPaymentAsync(PaymentProcessDto input, CancellationToken ct = default);

        /// <summary>
        /// Get all payments for a specific booking.
        /// </summary>
        Task<List<Payment>> GetPaymentsByBookingAsync(Guid bookingId, CancellationToken ct = default);

        /// <summary>
        /// Get payment status for a booking.
        /// </summary>
        Task<string> GetPaymentStatusAsync(Guid bookingId, CancellationToken ct = default);
    }
}
