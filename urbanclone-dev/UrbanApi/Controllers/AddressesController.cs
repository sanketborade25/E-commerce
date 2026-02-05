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
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public AddressesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("{userId:guid}")]
        public async Task<IActionResult> GetByUser(Guid userId, CancellationToken ct)
        {
            var list = await _db.Addresses.Where(a => a.UserId == userId && !a.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<AddressDto>>(list));
        }

        [HttpGet("id/{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var address = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
            if (address == null) return NotFound();
            return Ok(_mapper.Map<AddressDto>(address));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AddressCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Address>(input);
            _db.Addresses.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<AddressDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddressCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
            if (entity == null) return NotFound();
            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
