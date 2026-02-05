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
public class CitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public CitiesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // GET: api/Cities
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        {
            var cities = await _db.Cities
                                 .Where(c => !c.IsDeleted)
                                 .AsNoTracking()
                                 .ToListAsync(cancellationToken);
            var dto = _mapper.Map<List<CityDto>>(cities);
            return Ok(dto);
        }

        // GET: api/Cities/5
        [AllowAnonymous]
        [HttpGet("{id:int}", Name = "GetCity")]
        public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
        {
            var city = await _db.Cities
                               .AsNoTracking()
                               .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);

            if (city == null) return NotFound();

            return Ok(_mapper.Map<CityDto>(city));
        }

        // POST: api/Cities
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CityCreateDto input, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = _mapper.Map<City>(input);
            _db.Cities.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);

            var dto = _mapper.Map<CityDto>(entity);
            return CreatedAtRoute("GetCity", new { id = dto.Id }, dto);
        }

        // PUT: api/Cities/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CityCreateDto input, CancellationToken cancellationToken)
        {
            var entity = await _db.Cities.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);
            if (entity == null) return NotFound();

            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        // DELETE: api/Cities/5  (soft delete)
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var entity = await _db.Cities.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);
            if (entity == null) return NotFound();

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }
    }
}
