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
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public BookingsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/Bookings
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var list = await _db.Bookings
                .Include(b => b.Items)
                .Include(b => b.User)
                .Include(b => b.Professional)
                .Include(b => b.Address)
                .Where(b => !b.IsDeleted)
                .AsNoTracking()
                .ToListAsync(ct);

            return Ok(_mapper.Map<List<BookingDto>>(list));
        }

        // GET: api/Bookings/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var booking = await _db.Bookings
                .Include(b => b.Items)
                .Include(b => b.User)
                .Include(b => b.Professional)
                .Include(b => b.Address)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);

            if (booking == null) return NotFound();
            return Ok(_mapper.Map<BookingDto>(booking));
        }

        // POST: api/Bookings
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingCreateDto input, CancellationToken ct)
        {
            // basic validation
            if (input.Items == null || !input.Items.Any()) return BadRequest("Booking must have at least one item.");

            var booking = new Booking
            {
                UserId = input.UserId,
                ProfessionalId = input.ProfessionalId,
                BookingReference = $"BK-{Guid.NewGuid().ToString().Split('-')[0].ToUpper()}",
                Status = "Pending",
                ScheduledAt = input.ScheduledAt,
                AddressId = input.AddressId,
                TotalAmount = input.Items.Sum(i => i.Price),
                PaymentStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            foreach (var it in input.Items)
            {
                var bi = _mapper.Map<BookingItem>(it);
                booking.Items.Add(bi);
            }

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync(ct);

            var dto = _mapper.Map<BookingDto>(booking);
            return CreatedAtAction(nameof(Get), new { id = booking.Id }, dto);
        }

        // PUT: api/Bookings/{id}  (update status / assign pro etc.)
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] BookingCreateDto input, CancellationToken ct)
        {
            var booking = await _db.Bookings.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();

            // For simplicity we allow updating scheduled time, address, professional assignment and items replacement
            booking.ScheduledAt = input.ScheduledAt;
            booking.AddressId = input.AddressId;
            booking.ProfessionalId = input.ProfessionalId;
            booking.TotalAmount = input.Items.Sum(i => i.Price);
            booking.UpdatedAt = DateTime.UtcNow;

            // replace items (simple approach)
            _db.BookingItems.RemoveRange(booking.Items);
            booking.Items.Clear();
            foreach (var it in input.Items)
            {
                booking.Items.Add(_mapper.Map<BookingItem>(it));
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // DELETE: api/Bookings/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();
            booking.IsDeleted = true;
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
