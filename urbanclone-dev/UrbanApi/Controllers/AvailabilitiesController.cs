using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;
using UrbanApi.Services;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvailabilitiesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;
        private readonly ISlotService _slotService;

        public AvailabilitiesController(AppDbContext db, IMapper mapper, ISlotService slotService)
        {
            _db = db;
            _mapper = mapper;
            _slotService = slotService;
        }

        [HttpGet("professional/{proId:guid}")]
        public async Task<IActionResult> GetByProfessional(Guid proId, DateTime? date, CancellationToken ct)
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date;
            var slots = await _slotService.GetAvailableSlotsAsync(proId, targetDate, ct);
            var mapped = slots.Select(s => new AvailabilityDto
            {
                Id = s.AvailabilityId,
                ProfessionalId = s.ProfessionalId,
                StartAt = s.StartAt,
                EndAt = s.EndAt,
                Date = s.Date,
                Status = s.Status,
                IsRecurring = s.IsRecurring
            }).ToList();
            return Ok(mapped);
        }

        [HttpGet("/api/slots")]
        public async Task<IActionResult> GetSlots([FromQuery] Guid professionalId, [FromQuery] DateTime date, CancellationToken ct)
        {
            if (professionalId == Guid.Empty) return BadRequest("professionalId is required.");
            if (date == default) return BadRequest("date is required.");

            var slots = await _slotService.GetAvailableSlotsAsync(professionalId, date.Date, ct);
            return Ok(slots);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AvailabilityCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Availability>(input);
            entity.Status = string.IsNullOrWhiteSpace(entity.Status) ? "available" : entity.Status.Trim().ToLowerInvariant();
            entity.Date = entity.StartAt.Date;
            _db.Availabilities.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByProfessional), new { proId = entity.ProfessionalId }, _mapper.Map<AvailabilityDto>(entity));
        }
    }
}
