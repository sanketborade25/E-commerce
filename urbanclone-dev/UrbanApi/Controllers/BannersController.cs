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
    public class BannersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public BannersController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? section, CancellationToken ct)
        {
            var q = _db.BannerItems.Where(b => !b.IsDeleted && b.IsActive);
            if (!string.IsNullOrWhiteSpace(section))
            {
                q = q.Where(b => b.Section == section);
            }

            var list = await q
                .OrderBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .AsNoTracking()
                .ToListAsync(ct);

            return Ok(_mapper.Map<List<BannerDto>>(list));
        }

        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllForAdmin(CancellationToken ct)
        {
            var list = await _db.BannerItems
                .Where(b => !b.IsDeleted)
                .OrderBy(b => b.Section)
                .ThenBy(b => b.DisplayOrder)
                .ThenByDescending(b => b.CreatedAt)
                .AsNoTracking()
                .ToListAsync(ct);

            return Ok(_mapper.Map<List<BannerDto>>(list));
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var entity = await _db.BannerItems
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (entity == null) return NotFound();
            return Ok(_mapper.Map<BannerDto>(entity));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BannerCreateDto input, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(input.Section)) return BadRequest("Section is required.");
            if (string.IsNullOrWhiteSpace(input.ImageUrl)) return BadRequest("ImageUrl is required.");

            var entity = _mapper.Map<BannerItem>(input);
            entity.Section = input.Section.Trim();
            _db.BannerItems.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<BannerDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] BannerCreateDto input, CancellationToken ct)
        {
            var entity = await _db.BannerItems.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (entity == null) return NotFound();
            if (string.IsNullOrWhiteSpace(input.Section)) return BadRequest("Section is required.");
            if (string.IsNullOrWhiteSpace(input.ImageUrl)) return BadRequest("ImageUrl is required.");

            _mapper.Map(input, entity);
            entity.Section = input.Section.Trim();
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.BannerItems.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
