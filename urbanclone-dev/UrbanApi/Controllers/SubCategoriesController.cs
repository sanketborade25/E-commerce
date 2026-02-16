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
    public class SubCategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public SubCategoriesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, CancellationToken ct)
        {
            var q = _db.Categories
                .Where(c => !c.IsDeleted && c.ParentCategoryId != null)
                .AsQueryable();

            if (cityId.HasValue)
            {
                var citySubCategoryIds = _db.Services
                    .Where(s => !s.IsDeleted && s.CityId == cityId.Value && s.SubCategoryId != null)
                    .Select(s => s.SubCategoryId!.Value)
                    .Distinct();
                q = q.Where(c => citySubCategoryIds.Contains(c.Id));
            }

            var list = await q.AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<CategoryDto>>(list));
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var item = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted && c.ParentCategoryId != null, ct);
            if (item == null) return NotFound();
            return Ok(_mapper.Map<CategoryDto>(item));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CategoryCreateDto input, CancellationToken ct)
        {
            if (input.ParentCategoryId == null)
                return BadRequest("ParentCategoryId is required.");

            var parentExists = await _db.Categories.AnyAsync(
                c => c.Id == input.ParentCategoryId && !c.IsDeleted,
                ct);
            if (!parentExists)
                return BadRequest("Parent category not found.");

            var entity = _mapper.Map<Category>(input);
            _db.Categories.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<CategoryDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Categories
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (entity == null) return NotFound();

            if (input.ParentCategoryId == null)
                return BadRequest("ParentCategoryId is required.");

            var parentExists = await _db.Categories.AnyAsync(
                c => c.Id == input.ParentCategoryId && !c.IsDeleted,
                ct);
            if (!parentExists)
                return BadRequest("Parent category not found.");

            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Categories.FirstOrDefaultAsync(
                c => c.Id == id && !c.IsDeleted && c.ParentCategoryId != null,
                ct
            );
            if (entity == null) return NotFound();

            var now = DateTime.UtcNow;
            var serviceIds = await _db.Services
                .Where(s => !s.IsDeleted && s.SubCategoryId == id)
                .Select(s => s.Id)
                .ToListAsync(ct);

            if (serviceIds.Count > 0)
            {
                var relatedOptions = await _db.ServiceOptions
                    .Where(o => !o.IsDeleted && serviceIds.Contains(o.ServiceId))
                    .ToListAsync(ct);

                foreach (var option in relatedOptions)
                {
                    option.IsDeleted = true;
                    option.UpdatedAt = now;
                }

                var relatedServices = await _db.Services
                    .Where(s => !s.IsDeleted && serviceIds.Contains(s.Id))
                    .ToListAsync(ct);

                foreach (var service in relatedServices)
                {
                    service.IsDeleted = true;
                    service.UpdatedAt = now;
                }
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = now;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
