using Microsoft.EntityFrameworkCore;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Services
{
    /// <summary>
    /// Payment service implementation for handling payment processing, validation, and updates.
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PaymentService> _logger;
        private readonly INotificationService _notificationService;

        public PaymentService(AppDbContext db, ILogger<PaymentService> logger, INotificationService notificationService)
        {
            _db = db;
            _logger = logger;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Process a payment for a booking. This includes validation, duplicate prevention, and payment simulation.
        /// </summary>
        public async Task<PaymentResponseDto> ProcessPaymentAsync(PaymentProcessDto input, CancellationToken ct = default)
        {
            _logger.LogInformation($"Processing payment for booking {input.BookingId}, amount: {input.Amount}, provider: {input.Provider ?? "unknown"}");

            // Validate booking exists
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == input.BookingId && !b.IsDeleted, ct);
            if (booking == null)
            {
                _logger.LogWarning($"Payment attempt for non-existent booking: {input.BookingId}");
                throw new InvalidOperationException("Booking not found");
            }

            // Check for duplicate successful payments
            var existingSuccessfulPayment = await _db.Payments
                .FirstOrDefaultAsync(p => 
                    p.BookingId == input.BookingId && 
                    p.Status == "Completed" && 
                    !p.IsDeleted, 
                    ct);
            
            if (existingSuccessfulPayment != null)
            {
                _logger.LogWarning($"Duplicate payment attempt for booking: {input.BookingId}");
                throw new InvalidOperationException("Payment already processed for this booking");
            }

            // Validate payment amount
            if (input.Amount <= 0)
            {
                _logger.LogWarning($"Invalid payment amount for booking: {input.BookingId}, Amount: {input.Amount}");
                throw new InvalidOperationException("Payment amount must be greater than zero");
            }

            // Simulate payment processing
            var paymentStatus = SimulatePaymentProcessing(input);
            _logger.LogInformation($"Payment simulation result for booking {input.BookingId}: {paymentStatus}");

            // Create payment record
            var payment = new Payment
            {
                BookingId = input.BookingId,
                Provider = input.Provider ?? "Mock",
                ProviderPaymentId = input.ProviderPaymentId ?? GenerateMockPaymentId(),
                Amount = input.Amount,
                Status = paymentStatus
            };

            _db.Payments.Add(payment);

            // Update booking payment status
            booking.PaymentStatus = paymentStatus;
            
            // Update booking status based on payment result
            if (paymentStatus == "Completed")
            {
                booking.Status = "CONFIRMED";
            }
            else if (paymentStatus == "Failed")
            {
                booking.Status = "CANCELLED";
            }

            booking.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation($"Payment processed successfully for booking: {input.BookingId}, Status: {paymentStatus}");

                if (paymentStatus == "Completed")
                {
                    try 
                    {
                        await _notificationService.CreateCustomerNotificationAsync(booking.UserId, "Payment Successful", $"Your booking {booking.BookingReference} has been confirmed!");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogWarning($"Notification failed for booking {input.BookingId}: {notifEx.Message}");
                    }
                }
                else if (paymentStatus == "Failed")
                {
                    try 
                    {
                        await _notificationService.CreateCustomerNotificationAsync(booking.UserId, "Payment Failed", "Your payment attempt failed. Please try again.");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogWarning($"Notification failed for booking {input.BookingId}: {notifEx.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving payment record for booking: {input.BookingId}");
                throw;
            }

            var response = new PaymentResponseDto
            {
                Id = payment.Id,
                BookingId = payment.BookingId,
                Amount = payment.Amount,
                Status = payment.Status,
                Provider = payment.Provider,
                ProviderPaymentId = payment.ProviderPaymentId,
                Message = GetPaymentMessage(paymentStatus)
            };

            return response;
        }

        /// <summary>
        /// Get all payments for a specific booking.
        /// </summary>
        public async Task<List<Payment>> GetPaymentsByBookingAsync(Guid bookingId, CancellationToken ct = default)
        {
            return await _db.Payments
                .Where(p => p.BookingId == bookingId && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync(ct);
        }

        /// <summary>
        /// Get the current payment status for a booking.
        /// </summary>
        public async Task<string> GetPaymentStatusAsync(Guid bookingId, CancellationToken ct = default)
        {
            var booking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId && !b.IsDeleted, ct);
            
            return booking?.PaymentStatus ?? "Unknown";
        }

        /// <summary>
        /// Simulate payment processing with configurable success/failure logic.
        /// In real implementation, this would call actual payment gateway APIs.
        /// </summary>
        private string SimulatePaymentProcessing(PaymentProcessDto input)
        {
            // Force outcome for testing (takes precedence)
            var force = input.ForceOutcome?.ToLowerInvariant();
            if (force == "always-success") 
            {
                _logger.LogInformation($"Payment forced to SUCCESS for booking {input.BookingId}");
                return "Completed";
            }
            if (force == "always-fail")
            {
                _logger.LogWarning($"Payment forced to FAIL for booking {input.BookingId}");
                return "Failed"; 
            }

            // Validate amount first (fail immediately for invalid amounts)
            if (input.Amount <= 0)
            {
                _logger.LogWarning($"Invalid amount {input.Amount} for booking {input.BookingId}");
                return "Failed";
            }

            // Mock payment processing with ~90% success rate (random mode)
            var random = new Random();
            var successChance = random.NextDouble();
            
            // 10% failure rate for demo purposes to test error scenarios
            if (successChance < 0.1)
            {
                _logger.LogInformation($"Payment random FAIL (chance={successChance:F3}) for booking {input.BookingId}");
                return "Failed";
            }

            _logger.LogInformation($"Payment random SUCCESS (chance={successChance:F3}) for booking {input.BookingId}");
            return "Completed";
        }

        /// <summary>
        /// Generate a mock payment ID for non-real payment gateways.
        /// </summary>
        private string GenerateMockPaymentId()
        {
            return "PAY_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper();
        }

        /// <summary>
        /// Get a user-friendly message based on payment status.
        /// </summary>
        private string GetPaymentMessage(string status)
        {
            return status switch
            {
                "Completed" => "Payment successful! Your booking has been confirmed.",
                "Failed" => "Payment failed. Please try again or use a different payment method.",
                "Processing" => "Payment is being processed. Please wait...",
                _ => "Payment status unknown."
            };
        }
    }
}
