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
    public class AvailabilitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public AvailabilitiesController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("professional/{proId:guid}")]
        public async Task<IActionResult> GetByProfessional(Guid proId, CancellationToken ct)
        {
            var list = await _db.Availabilities.Where(a => a.ProfessionalId == proId && !a.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<AvailabilityDto>>(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AvailabilityCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Availability>(input);
            _db.Availabilities.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByProfessional), new { proId = entity.ProfessionalId }, _mapper.Map<AvailabilityDto>(entity));
        }
    }
}
