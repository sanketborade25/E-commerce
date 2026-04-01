using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;
using UrbanApi.Services;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;
        private readonly ISlotService _slotService;

        public BookingsController(AppDbContext db, IMapper mapper, ISlotService slotService)
        {
            _db = db;
            _mapper = mapper;
            _slotService = slotService;
        }

        private static readonly HashSet<string> _validPartnerStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "STARTED", "COMPLETED", "REJECTED", "PENDING"
        };

        private async Task<Guid?> GetProfessionalIdFromClaims(CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId)) return null;
            var pro = await _db.Professionals.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId && !p.IsDeleted, ct);
            return pro?.Id;
        }

        private async Task<Professional?> PickBestPartnerForBooking(int targetCityId, DateTime scheduledAt, List<int> requiredCategoryIds, CancellationToken ct)
        {
            var candidates = await _db.Professionals
                .Include(p => p.ProfessionalCategories)
                .Where(p => !p.IsDeleted && p.IsOnline && p.CityId == targetCityId)
                .ToListAsync(ct);

            var matching = candidates
                .Where(p => requiredCategoryIds.Count == 0 || p.ProfessionalCategories.Any(pc => requiredCategoryIds.Contains(pc.CategoryId)))
                .ToList();

            var available = new List<Professional>();
            foreach (var p in matching)
            {
                var hasSlot = await _db.Availabilities.AnyAsync(
                    a => !a.IsDeleted
                         && a.Status == "available"
                         && a.ProfessionalId == p.Id
                         && a.StartAt <= scheduledAt
                         && a.EndAt >= scheduledAt,
                    ct
                );
                if (hasSlot) available.Add(p);
            }

            var best = available
                .OrderBy(p => _db.Bookings.Count(b => b.ProfessionalId == p.Id && !b.IsDeleted && new[] { "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "STARTED" }.Contains(b.Status)))
                .FirstOrDefault();

            return best;
        }

        private async Task<bool> TryReassignBooking(Booking booking, CancellationToken ct)
        {
            if (booking == null) return false;
            var address = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == booking.AddressId && a.CityId != null && !a.IsDeleted, ct);
            if (address == null) return false;

            var serviceIds = booking.Items.Select(i => i.ServiceId).ToList();
            var requiredCategoryIds = await _db.Services.Where(s => serviceIds.Contains(s.Id)).Select(s => s.CategoryId).Distinct().ToListAsync(ct);

            var nextPro = await PickBestPartnerForBooking(address.CityId!.Value, booking.ScheduledAt, requiredCategoryIds, ct);
            if (nextPro == null)
            {
                booking.ProfessionalId = null;
                booking.Status = "PENDING";
            }
            else
            {
                booking.ProfessionalId = nextPro.Id;
                booking.Status = "ASSIGNED";
            }
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return nextPro != null;
        }

        // GET: api/Bookings
        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var list = await _db.Bookings
                .Include(b => b.Items)
                .Include(b => b.User)
                .Include(b => b.Professional)
                .Include(b => b.Address)
                .Where(b => !b.IsDeleted)
                .AsNoTracking()
                .ToListAsync(ct);

            return Ok(_mapper.Map<List<BookingDto>>(list));
        }

        // GET: api/Bookings/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var booking = await _db.Bookings
                .Include(b => b.Items)
                .Include(b => b.User)
                .Include(b => b.Professional)
                .Include(b => b.Address)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);

            if (booking == null) return NotFound();
            return Ok(_mapper.Map<BookingDto>(booking));
        }

        // POST: api/Bookings
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookingCreateDto input, CancellationToken ct)
        {
            if (input.Items == null || !input.Items.Any())
                return BadRequest("Booking must have at least one item.");

            var address = await _db.Addresses
                .Include(a => a.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == input.AddressId && !a.IsDeleted, ct);

            if (address == null || address.CityId == null)
                return BadRequest("Valid address with city is required to create booking.");

            var targetCityId = address.CityId.Value;

            foreach (var item in input.Items)
            {
                var service = await _db.Services
                    .Include(s => s.CityStatuses)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.Id == item.ServiceId && !s.IsDeleted, ct);

                if (service == null)
                    return BadRequest($"Service {item.ServiceId} not found.");

                if (!service.IsActive)
                    return Forbid("Service is not globally enabled.");

                var cityStatus = service.CityStatuses.FirstOrDefault(cs => cs.CityId == targetCityId);
                var isCityEnabled = cityStatus != null ? cityStatus.IsEnabled : service.CityId == targetCityId;

                if (!isCityEnabled)
                    return Forbid($"Service {service.Title} is disabled in selected city.");
            }

            var booking = new Booking
            {
                UserId = input.UserId,
                ProfessionalId = null,
                BookingReference = $"BK-{Guid.NewGuid().ToString().Split('-')[0].ToUpper()}",
                Status = "PENDING",
                ScheduledAt = input.ScheduledAt,
                AddressId = input.AddressId,
                TotalAmount = input.Items.Sum(i => i.Price),
                PaymentStatus = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            foreach (var it in input.Items)
            {
                var bi = _mapper.Map<BookingItem>(it);
                booking.Items.Add(bi);
            }

            // eligible partners by city and category
            var serviceCategoryIds = await _db.Services
                .Where(s => input.Items.Select(i => i.ServiceId).Contains(s.Id) && !s.IsDeleted)
                .Select(s => s.CategoryId)
                .Distinct()
                .ToListAsync(ct);

            Guid? selectedProfessionalId = input.ProfessionalId;
            if (selectedProfessionalId.HasValue)
            {
                var requestedProfessionalExists = await _db.Professionals
                    .AsNoTracking()
                    .AnyAsync(p => p.Id == selectedProfessionalId.Value && !p.IsDeleted && p.CityId == targetCityId, ct);

                if (!requestedProfessionalExists)
                    return BadRequest("Selected professional is not available in the selected city.");
            }
            else
            {
                var assignedPro = await PickBestPartnerForBooking(targetCityId, input.ScheduledAt, serviceCategoryIds, ct);
                selectedProfessionalId = assignedPro?.Id;
            }

            if (!selectedProfessionalId.HasValue)
                return Conflict("No professional slot is available for the selected time.");

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            var slotReservation = await _slotService.TryReserveSlotAsync(selectedProfessionalId.Value, input.ScheduledAt, ct);
            if (!slotReservation.Success)
                return Conflict(slotReservation.Message);

            var overlapStart = slotReservation.StartAt ?? input.ScheduledAt;
            var overlapEnd = slotReservation.EndAt ?? input.ScheduledAt.AddMinutes(1);
            var alreadyBooked = await _db.Bookings.AnyAsync(
                b => !b.IsDeleted
                     && b.ProfessionalId == selectedProfessionalId.Value
                     && b.ScheduledAt >= overlapStart
                     && b.ScheduledAt < overlapEnd
                     && b.Status != "REJECTED"
                     && b.Status != "CANCELLED",
                ct
            );

            if (alreadyBooked)
                return Conflict("Selected slot is already booked.");

            booking.ProfessionalId = selectedProfessionalId.Value;
            booking.AvailabilityId = slotReservation.AvailabilityId;
            booking.Status = "ASSIGNED";

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            var dto = _mapper.Map<BookingDto>(booking);
            return CreatedAtAction(nameof(Get), new { id = booking.Id }, dto);
        }

        // PUT: api/Bookings/{id}  (update status / assign pro etc.)
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] BookingCreateDto input, CancellationToken ct)
        {
            var booking = await _db.Bookings.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();

            // For simplicity we allow updating scheduled time, address, professional assignment and items replacement
            booking.ScheduledAt = input.ScheduledAt;
            booking.AddressId = input.AddressId;
            booking.ProfessionalId = input.ProfessionalId;
            booking.TotalAmount = input.Items.Sum(i => i.Price);
            booking.UpdatedAt = DateTime.UtcNow;

            // replace items (simple approach)
            _db.BookingItems.RemoveRange(booking.Items);
            booking.Items.Clear();
            foreach (var it in input.Items)
            {
                booking.Items.Add(_mapper.Map<BookingItem>(it));
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [Authorize(Roles = "Professional")]
        [HttpPatch("/api/booking/{id:guid}/accept")]
        public async Task<IActionResult> AcceptBooking(Guid id, CancellationToken ct)
        {
            var proId = await GetProfessionalIdFromClaims(ct);
            if (proId == null) return Forbid();

            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();
            if (booking.ProfessionalId != proId) return Forbid("Can only accept your own bookings.");
            if (!string.Equals(booking.Status, "ASSIGNED", StringComparison.OrdinalIgnoreCase) && !string.Equals(booking.Status, "PENDING", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only assigned or pending bookings can be accepted.");

            booking.Status = "ACCEPTED";
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [Authorize(Roles = "Professional")]
        [HttpPatch("/api/booking/{id:guid}/reject")]
        public async Task<IActionResult> RejectBooking(Guid id, CancellationToken ct)
        {
            var proId = await GetProfessionalIdFromClaims(ct);
            if (proId == null) return Forbid();

            var booking = await _db.Bookings.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();
            if (booking.ProfessionalId != proId) return Forbid("Can only reject your own bookings.");
            if (!string.Equals(booking.Status, "ASSIGNED", StringComparison.OrdinalIgnoreCase) && !string.Equals(booking.Status, "PENDING", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only assigned or pending bookings can be rejected.");

            booking.Status = "REJECTED";
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            var reassigned = await TryReassignBooking(booking, ct);
            return reassigned ? NoContent() : Ok(new { message = "Booking rejected; no other partner available" });
        }

        [Authorize(Roles = "Professional")]
        [HttpPatch("/api/booking/{id:guid}/status")]
        public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] BookingStatusUpdateDto input, CancellationToken ct)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.Status)) return BadRequest("Status is required.");
            var status = input.Status.Trim().ToUpperInvariant();
            if (!_validPartnerStatuses.Contains(status)) return BadRequest("Invalid status.");

            var proId = await GetProfessionalIdFromClaims(ct);
            if (proId == null) return Forbid();

            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();
            if (booking.ProfessionalId != proId) return Forbid("Can only update your own bookings.");

            booking.Status = status;
            booking.UpdatedAt = DateTime.UtcNow;

            if (status == "COMPLETED")
            {
                var professional = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == proId && !p.IsDeleted, ct);
                if (professional != null)
                {
                    professional.Earnings += booking.TotalAmount;
                    professional.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [Authorize]
        [HttpGet("/api/booking/my")]
        public async Task<IActionResult> GetMyBookings(CancellationToken ct)
        {
            var proId = await GetProfessionalIdFromClaims(ct);
            if (proId == null) return Forbid();

            var list = await _db.Bookings
                .Include(b => b.Items)
                .Where(b => b.ProfessionalId == proId && !b.IsDeleted)
                .OrderByDescending(b => b.ScheduledAt)
                .AsNoTracking()
                .ToListAsync(ct);

            return Ok(_mapper.Map<List<BookingDto>>(list));
        }
        // DELETE: api/Bookings/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted, ct);
            if (booking == null) return NotFound();
            booking.IsDeleted = true;
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}

