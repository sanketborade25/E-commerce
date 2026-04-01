using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
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
                IsRecurring = false
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
            try
            {
                var entity = _mapper.Map<Availability>(input);
                _db.Availabilities.Add(entity);
                await _db.SaveChangesAsync(ct);
                return CreatedAtAction(nameof(GetByProfessional), new { proId = entity.ProfessionalId }, _mapper.Map<AvailabilityDto>(entity));
            }
            catch (SqlException ex) when (ex.Number == 207)
            {
                await _db.Database.ExecuteSqlInterpolatedAsync(
                    $@"INSERT INTO Availabilities
                       (ProfessionalId, StartAt, EndAt, IsRecurring, CreatedAt, IsDeleted)
                       VALUES
                       ({input.ProfessionalId}, {input.StartAt}, {input.EndAt}, {input.IsRecurring}, {DateTime.UtcNow}, {false})",
                    ct
                );

                var created = await _db.Availabilities
                    .AsNoTracking()
                    .Where(a =>
                        a.ProfessionalId == input.ProfessionalId &&
                        !a.IsDeleted &&
                        a.StartAt == input.StartAt &&
                        a.EndAt == input.EndAt)
                    .OrderByDescending(a => a.Id)
                    .Select(a => new AvailabilityDto
                    {
                        Id = a.Id,
                        ProfessionalId = a.ProfessionalId,
                        StartAt = a.StartAt,
                        EndAt = a.EndAt,
                        IsRecurring = a.IsRecurring,
                        Date = a.StartAt.Date,
                        Status = "available"
                    })
                    .FirstOrDefaultAsync(ct);

                if (created == null)
                    return StatusCode(500, "Availability was created but could not be reloaded.");

                return CreatedAtAction(nameof(GetByProfessional), new { proId = created.ProfessionalId }, created);
            }
        }
    }
}
