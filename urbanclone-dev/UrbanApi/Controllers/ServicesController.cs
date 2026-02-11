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
public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ServicesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, [FromQuery] int? categoryId, [FromQuery] int? subCategoryId, CancellationToken ct)
        {
            var q = _db.Services
                .Where(s => !s.IsDeleted)
                .AsQueryable();

            if (cityId.HasValue)
                q = q.Where(s => s.CityId == cityId.Value || s.CityId == null);
            if (categoryId.HasValue) q = q.Where(s => s.CategoryId == categoryId.Value);
            if (subCategoryId.HasValue) q = q.Where(s => s.SubCategoryId == subCategoryId.Value);

            var list = await q.Include(s => s.Category).Include(s => s.City).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<ServiceDto>>(list));
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, CancellationToken ct)
        {
            var service = await _db.Services
                .Include(s => s.Options)
                .Include(s => s.Category)
                .Include(s => s.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);

            if (service == null) return NotFound();
            return Ok(_mapper.Map<ServiceDto>(service));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ServiceCreateDto input, CancellationToken ct)
        {
            if (input.SubCategoryId == null)
                return BadRequest("SubCategoryId is required.");

            var subCategory = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == input.SubCategoryId && !c.IsDeleted, ct);
            if (subCategory == null)
                return BadRequest("Sub category not found.");
            if (subCategory.ParentCategoryId == null || subCategory.ParentCategoryId != input.CategoryId)
                return BadRequest("Sub category does not belong to the selected category.");

            var entity = _mapper.Map<Service>(input);
            _db.Services.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<ServiceDto>(entity));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ServiceCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Services.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
            if (entity == null) return NotFound();

            if (input.SubCategoryId == null)
                return BadRequest("SubCategoryId is required.");

            var subCategory = await _db.Categories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == input.SubCategoryId && !c.IsDeleted, ct);
            if (subCategory == null)
                return BadRequest("Sub category not found.");
            if (subCategory.ParentCategoryId == null || subCategory.ParentCategoryId != input.CategoryId)
                return BadRequest("Sub category does not belong to the selected category.");

            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            var entity = await _db.Services.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
