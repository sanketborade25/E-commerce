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
// Read-only for public, admin for write
public class ServiceOptionsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ServiceOptionsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var list = await _db.ServiceOptions.Where(o => !o.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<ServiceOptionDto>>(list));
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var entity = await _db.ServiceOptions.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct);
            if (entity == null) return NotFound();
            return Ok(_mapper.Map<ServiceOptionDto>(entity));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ServiceOptionCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<ServiceOption>(input);
            _db.ServiceOptions.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<ServiceOptionDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ServiceOptionCreateDto input, CancellationToken ct)
        {
            var entity = await _db.ServiceOptions.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct);
            if (entity == null) return NotFound();
            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.ServiceOptions.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
