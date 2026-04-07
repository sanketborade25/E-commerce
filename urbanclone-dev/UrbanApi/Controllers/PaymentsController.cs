using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;
using UrbanApi.Services;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(AppDbContext db, IMapper mapper, IPaymentService paymentService, ILogger<PaymentsController> logger)
        {
            _db = db;
            _mapper = mapper;
            _paymentService = paymentService;
            _logger = logger;
        }

        [HttpGet("{bookingId:guid}")]
        public async Task<IActionResult> GetByBooking(Guid bookingId, CancellationToken ct)
        {
            var list = await _db.Payments.Where(p => p.BookingId == bookingId && !p.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<PaymentDto>>(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PaymentCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Payment>(input);
            _db.Payments.Add(entity);

            // update booking payment status if provided
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == input.BookingId, ct);
            if (booking != null)
            {
                booking.PaymentStatus = entity.Status ?? booking.PaymentStatus;
            }

            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByBooking), new { bookingId = entity.BookingId }, _mapper.Map<PaymentDto>(entity));
        }

        /// <summary>
        /// Process a payment for a booking. This is a mock payment processor that simulates payment success/failure.
        /// In real world, this would integrate with a payment gateway (Stripe, Razorpay, PayPal, etc.)
        /// </summary>
        [HttpPost("process")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentProcessDto input, CancellationToken ct)
        {
            try
            {
                // Use payment service to process payment
                var response = await _paymentService.ProcessPaymentAsync(input, ct);
                
                // Return appropriate status code and response
                if (response.Status == "Completed")
                {
                    return Ok(response);
                }
                else
                {
                    return BadRequest(response);
                }
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid payment operation");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing payment");
                return StatusCode(500, new { message = "An unexpected error occurred while processing your payment. Please try again." });
            }
        }

        /// <summary>
        /// Get payment status for a specific booking.
        /// </summary>
        [HttpGet("status/{bookingId:guid}")]
        public async Task<IActionResult> GetPaymentStatus(Guid bookingId, CancellationToken ct)
        {
            try
            {
                var status = await _paymentService.GetPaymentStatusAsync(bookingId, ct);
                return Ok(new { bookingId, paymentStatus = status });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting payment status");
                return StatusCode(500, new { message = "Error retrieving payment status" });
            }
        }
    }
}
