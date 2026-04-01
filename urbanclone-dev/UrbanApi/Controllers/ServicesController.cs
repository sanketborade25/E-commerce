using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;
        private readonly ILogger<ServicesController> _logger;

        public ServicesController(AppDbContext db, IMapper mapper, ILogger<ServicesController> logger)
        {
            _db = db;
            _mapper = mapper;
            _logger = logger;
        }

        private async Task<Dictionary<int, int>> GetPartnerCountByCity(CancellationToken ct)
        {
            return await _db.Professionals
                .Where(p => !p.IsDeleted && p.CityId.HasValue)
                .GroupBy(p => p.CityId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Count(), ct);
        }

        private async Task<Dictionary<int, int>> GetAvailableSlotsByCity(CancellationToken ct)
        {
            var now = DateTime.UtcNow;
            try
            {
                return await _db.Availabilities
                    .Where(a => a.EndAt >= now && a.Professional.CityId.HasValue)
                    .GroupBy(a => a.Professional.CityId!.Value)
                    .ToDictionaryAsync(g => g.Key, g => g.Count(), ct);
            }
            catch (SqlException ex) when (ex.Number == 207)
            {
                _logger.LogWarning(
                    ex,
                    "Availabilities schema is missing expected columns. Returning fallback slot counts."
                );
                return new Dictionary<int, int>();
            }
        }

        private ServiceDto BuildServiceDto(Service service, int? cityId, Dictionary<int, int> partnersByCity, Dictionary<int, int> slotsByCity)
        {
            try
            {
                service.CityStatuses ??= new List<ServiceCityStatus>();
                service.Options ??= new List<ServiceOption>();

                var dto = _mapper.Map<ServiceDto>(service);
                var statuses = service.CityStatuses ?? new List<ServiceCityStatus>();

                var mappedCityIds = new HashSet<int>();
                if (cityId.HasValue)
                {
                    mappedCityIds.Add(cityId.Value);
                }
                else if (statuses.Any())
                {
                    foreach (var status in statuses) mappedCityIds.Add(status.CityId);
                }
                else if (service.CityId.HasValue)
                {
                    mappedCityIds.Add(service.CityId.Value);
                }

                dto.PartnerCount = mappedCityIds.Sum(cid => partnersByCity.ContainsKey(cid) ? partnersByCity[cid] : 0);
                dto.AvailableSlots = mappedCityIds.Sum(cid => slotsByCity.ContainsKey(cid) ? slotsByCity[cid] : 0);

                dto.CityStatuses = statuses.Select(v => new ServiceCityStatusDto
                {
                    CityId = v.CityId,
                    CityName = v.City?.Name,
                    IsEnabled = v.IsEnabled
                }).ToList();

                var cityEnabled = false;
                if (cityId.HasValue)
                {
                    var status = statuses.FirstOrDefault(x => x.CityId == cityId.Value);
                    cityEnabled = status != null ? status.IsEnabled : service.CityId == cityId.Value;
                }
                else
                {
                    cityEnabled = statuses.Any(x => x.IsEnabled) || service.CityId.HasValue;
                }

                dto.IsVisible = service.IsActive && cityEnabled;
                dto.IsBookable = dto.IsVisible && dto.AvailableSlots > 0;

                return dto;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BuildServiceDto failed for ServiceId {ServiceId} CityId {CityId}", service?.Id, cityId);
                throw;
            }
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, [FromQuery] int? categoryId, [FromQuery] int? subCategoryId, CancellationToken ct)
        {
            var q = _db.Services
                .Where(s => !s.IsDeleted && s.IsActive)
                .AsQueryable();

            if (categoryId.HasValue) q = q.Where(s => s.CategoryId == categoryId.Value);
            if (subCategoryId.HasValue) q = q.Where(s => s.SubCategoryId == subCategoryId.Value);

            if (cityId.HasValue)
            {
                q = q.Where(s => s.CityStatuses.Any(cs => cs.CityId == cityId.Value && cs.IsEnabled)
                                 || s.CityId == cityId.Value);
            }

            var list = await q
                .Include(s => s.Category)
                .Include(s => s.SubCategory)
                .Include(s => s.City)
                .Include(s => s.Options)
                .Include(s => s.CityStatuses).ThenInclude(cs => cs.City)
                .AsNoTracking()
                .ToListAsync(ct);

            var partnersByCity = await GetPartnerCountByCity(ct);
            var slotsByCity = await GetAvailableSlotsByCity(ct);

            var result = list.Select(service => BuildServiceDto(service, cityId, partnersByCity, slotsByCity)).ToList();
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id, [FromQuery] int? cityId, CancellationToken ct)
        {
            var service = await _db.Services
                .Include(s => s.Options)
                .Include(s => s.Category)
                .Include(s => s.SubCategory)
                .Include(s => s.City)
                .Include(s => s.CityStatuses).ThenInclude(cs => cs.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);

            if (service == null) return NotFound();

            var partnersByCity = await GetPartnerCountByCity(ct);
            var slotsByCity = await GetAvailableSlotsByCity(ct);
            return Ok(BuildServiceDto(service, cityId, partnersByCity, slotsByCity));
        }

        [HttpGet("/api/admin/services")]
        public async Task<IActionResult> GetAdminServices(CancellationToken ct)
        {
            var services = await _db.Services
                .Where(s => !s.IsDeleted)
                .Include(s => s.Category)
                .Include(s => s.SubCategory)
                .Include(s => s.City)
                .Include(s => s.Options)
                .Include(s => s.CityStatuses).ThenInclude(cs => cs.City)
                .AsNoTracking()
                .ToListAsync(ct);

            var partnersByCity = await GetPartnerCountByCity(ct);
            var slotsByCity = await GetAvailableSlotsByCity(ct);

            var result = services.Select(svc => BuildServiceDto(svc, null, partnersByCity, slotsByCity)).ToList();
            return Ok(result);
        }

        [HttpPatch("~/api/service/{id:int}/enable")]
        public async Task<IActionResult> EnableService(int id, [FromQuery] int cityId, CancellationToken ct)
        {
            if (cityId <= 0) return BadRequest("cityId is required for enabling city-level status.");

            var service = await _db.Services
                .Include(s => s.Options)
                .Include(s => s.CityStatuses)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);

            if (service == null) return NotFound("Service not found.");

            if (service.CategoryId == 0 || service.SubCategoryId == null)
                return BadRequest("Service category and subcategory mapping is incomplete.");

            var subCategory = await _db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == service.SubCategoryId && !c.IsDeleted, ct);
            if (subCategory == null || subCategory.ParentCategoryId != service.CategoryId)
                return BadRequest("Service category/subcategory mapping is invalid.");

            if (!service.Options.Any(o => o.Price > 0 && o.DurationMinutes.HasValue && o.DurationMinutes.Value > 0))
                return BadRequest("At least one service option with valid price and duration is required.");

            var city = await _db.Cities.AsNoTracking().FirstOrDefaultAsync(c => c.Id == cityId && !c.IsDeleted, ct);
            if (city == null) return BadRequest("City not found.");

            var partnerCount = await _db.Professionals.CountAsync(p => p.CityId == cityId && !p.IsDeleted, ct);
            if (partnerCount == 0) return BadRequest("No active partners available in selected city.");

            service.IsActive = true;

            var cityStatus = service.CityStatuses.FirstOrDefault(cs => cs.CityId == cityId);
            if (cityStatus == null)
            {
                cityStatus = new ServiceCityStatus
                {
                    ServiceId = service.Id,
                    CityId = cityId,
                    IsEnabled = true
                };
                _db.ServiceCityStatuses.Add(cityStatus);
            }
            else
            {
                cityStatus.IsEnabled = true;
            }

            service.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok(new { message = "Service enabled for city", partnerCount });
        }

        [HttpPatch("~/api/service/{id:int}/disable")]
        public async Task<IActionResult> DisableService(int id, [FromQuery] int? cityId, CancellationToken ct)
        {
            var service = await _db.Services
                .Include(s => s.CityStatuses)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, ct);
            if (service == null) return NotFound("Service not found.");

            if (cityId.HasValue && cityId > 0)
            {
                var cityStatus = service.CityStatuses.FirstOrDefault(cs => cs.CityId == cityId.Value);
                if (cityStatus == null)
                {
                    cityStatus = new ServiceCityStatus
                    {
                        ServiceId = service.Id,
                        CityId = cityId.Value,
                        IsEnabled = false
                    };
                    _db.ServiceCityStatuses.Add(cityStatus);
                }
                else
                {
                    cityStatus.IsEnabled = false;
                }
            }
            else
            {
                service.IsActive = false;
                foreach (var status in service.CityStatuses)
                    status.IsEnabled = false;
            }

            service.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Service disabled", serviceId = id, cityId = cityId });
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

            if (input.CityId.HasValue)
            {
                var exists = await _db.ServiceCityStatuses.AnyAsync(st => st.ServiceId == entity.Id && st.CityId == input.CityId.Value, ct);
                if (!exists)
                {
                    _db.ServiceCityStatuses.Add(new ServiceCityStatus
                    {
                        ServiceId = entity.Id,
                        CityId = input.CityId.Value,
                        IsEnabled = entity.IsActive
                    });
                    await _db.SaveChangesAsync(ct);
                }
            }

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

            var relatedOptions = await _db.ServiceOptions
                .Where(o => o.ServiceId == id && !o.IsDeleted)
                .ToListAsync(ct);

            foreach (var option in relatedOptions)
            {
                option.IsDeleted = true;
                option.UpdatedAt = DateTime.UtcNow;
            }

            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
