using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public PaymentsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
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

            // update booking payment status if needed
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == input.BookingId, ct);
            if (booking != null)
            {
                booking.PaymentStatus = entity.Status ?? booking.PaymentStatus;
            }

            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByBooking), new { bookingId = entity.BookingId }, _mapper.Map<PaymentDto>(entity));
        }
    }
}
