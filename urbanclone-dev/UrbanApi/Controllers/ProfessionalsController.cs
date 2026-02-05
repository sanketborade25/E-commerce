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
    public class ProfessionalsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ProfessionalsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, CancellationToken ct)
        {
            var q = _db.Professionals.Where(p => !p.IsDeleted);
            if (cityId.HasValue) q = q.Where(p => p.CityId == cityId.Value);
            var list = await q.AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<ProfessionalDto>>(list));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var pro = await _db.Professionals.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (pro == null) return NotFound();
            return Ok(_mapper.Map<ProfessionalDto>(pro));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProfessionalCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Professional>(input);
            _db.Professionals.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<ProfessionalDto>(entity));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ProfessionalCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (entity == null) return NotFound();
            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
