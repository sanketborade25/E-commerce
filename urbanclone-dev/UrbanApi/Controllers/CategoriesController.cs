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
public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public CategoriesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, CancellationToken ct)
        {
            var q = _db.Categories
                .Where(c => !c.IsDeleted && c.ParentCategoryId == null)
                .AsQueryable();

            if (cityId.HasValue)
            {
                var cityCategoryIds = _db.Services
                    .Where(s => !s.IsDeleted && s.CityId == cityId.Value)
                    .Select(s => s.CategoryId)
                    .Distinct();
                q = q.Where(c => cityCategoryIds.Contains(c.Id));
            }

            var categories = await q.AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<CategoryDto>>(categories));
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var item = await _db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<CategoryDto>(item));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Category>(input);
            _db.Categories.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<CategoryDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (entity == null) return NotFound();
            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
