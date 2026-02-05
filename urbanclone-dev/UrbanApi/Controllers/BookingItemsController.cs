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
    public class BookingItemsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public BookingItemsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("{bookingId:guid}")]
        public async Task<IActionResult> GetByBooking(Guid bookingId, CancellationToken ct)
        {
            var list = await _db.BookingItems.Where(bi => bi.BookingId == bookingId && !bi.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<BookingItemDto>>(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingItemCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<BookingItem>(input);
            _db.BookingItems.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByBooking), new { bookingId = entity.BookingId }, _mapper.Map<BookingItemDto>(entity));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.BookingItems.FirstOrDefaultAsync(bi => bi.Id == id && !bi.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
