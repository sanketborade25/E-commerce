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

        private static readonly Dictionary<string, HashSet<string>> _adminStatusTransitions =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["PENDING"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "ACCEPTED", "CANCELLED" },
                ["ASSIGNED"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "ACCEPTED", "CANCELLED" },
                ["ACCEPTED"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "COMPLETED" },
                ["COMPLETED"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                ["CANCELLED"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            };

        private static bool IsValidAdminTransition(string current, string next)
        {
            if (string.Equals(current, next, StringComparison.OrdinalIgnoreCase)) return true;
            return _adminStatusTransitions.TryGetValue(current, out var allowed) && allowed.Contains(next);
        }

        private static string NormalizeStatus(string? status)
        {
            return string.IsNullOrWhiteSpace(status) ? "PENDING" : status.Trim().ToUpperInvariant();
        }

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
                    a => a.Status == "available"
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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

        [Authorize(Roles = "Admin")]
        [HttpGet("/api/admin/bookings")]
        public async Task<IActionResult> GetAdminBookings(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] int? cityId,
            [FromQuery] DateTime? dateFrom,
            [FromQuery] DateTime? dateTo,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var normalizedStatus = string.IsNullOrWhiteSpace(status)
                ? null
                : status.Trim().ToUpperInvariant();

            var query = _db.Bookings
                .Include(b => b.User)
                .Include(b => b.Professional).ThenInclude(p => p!.User)
                .Include(b => b.Address).ThenInclude(a => a!.City)
                .Include(b => b.Items).ThenInclude(i => i.Service)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(normalizedStatus))
            {
                query = query.Where(b => b.Status.ToUpper() == normalizedStatus);
            }

            if (cityId.HasValue && cityId.Value > 0)
            {
                query = query.Where(b => b.Address != null && b.Address.CityId == cityId.Value);
            }

            if (dateFrom.HasValue)
            {
                query = query.Where(b => b.ScheduledAt >= dateFrom.Value);
            }

            if (dateTo.HasValue)
            {
                var endExclusive = dateTo.Value.Date.AddDays(1);
                query = query.Where(b => b.ScheduledAt < endExclusive);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLowerInvariant();
                query = query.Where(b =>
                    (b.BookingReference != null && b.BookingReference.ToLower().Contains(q)) ||
                    (b.User != null && b.User.FullName != null && b.User.FullName.ToLower().Contains(q)) ||
                    (b.User != null && b.User.Phone != null && b.User.Phone.ToLower().Contains(q)) ||
                    b.Items.Any(i => i.Service != null && i.Service.Title != null && i.Service.Title.ToLower().Contains(q))
                );
            }

            var total = await query.CountAsync(ct);

            var mapped = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .Select(b => new AdminBookingDto
                {
                    Id = b.Id,
                    BookingReference = b.BookingReference ?? string.Empty,
                    UserId = b.UserId,
                    UserName = b.User != null ? b.User.FullName : null,
                    UserPhone = b.User != null ? b.User.Phone : null,
                    ProfessionalId = b.ProfessionalId,
                    ProfessionalName = b.Professional == null
                        ? null
                        : (b.Professional.DisplayName ?? (b.Professional.User != null ? b.Professional.User.FullName : null)),
                    CityId = b.Address != null ? b.Address.CityId : null,
                    CityName = b.Address != null && b.Address.City != null ? b.Address.City.Name : null,
                    ScheduledAt = b.ScheduledAt,
                    Status = b.Status ?? string.Empty,
                    TotalAmount = b.TotalAmount,
                    PaymentStatus = b.PaymentStatus ?? string.Empty,
                    AddressId = b.AddressId,
                    AddressLine1 = b.Address != null ? b.Address.Line1 : null,
                    AddressLine2 = b.Address != null ? b.Address.Line2 : null,
                    Pincode = b.Address != null ? b.Address.Pincode : null,
                    Items = b.Items.Select(i => new AdminBookingItemDto
                    {
                        ServiceId = i.ServiceId,
                        ServiceName = i.Service != null ? i.Service.Title : null,
                        Price = i.Price,
                        DurationMinutes = i.DurationMinutes
                    }).ToList(),
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(new AdminBookingListResponse
            {
                Items = mapped,
                Total = total,
                Page = page,
                PageSize = pageSize
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("/api/admin/bookings/{id:guid}")]
        public async Task<IActionResult> GetAdminBooking(Guid id, CancellationToken ct)
        {
            var booking = await _db.Bookings
                .AsNoTracking()
                .Where(b => b.Id == id)
                .Select(b => new AdminBookingDto
                {
                    Id = b.Id,
                    BookingReference = b.BookingReference ?? string.Empty,
                    UserId = b.UserId,
                    UserName = b.User != null ? b.User.FullName : null,
                    UserPhone = b.User != null ? b.User.Phone : null,
                    ProfessionalId = b.ProfessionalId,
                    ProfessionalName = b.Professional == null
                        ? null
                        : (b.Professional.DisplayName ?? (b.Professional.User != null ? b.Professional.User.FullName : null)),
                    CityId = b.Address != null ? b.Address.CityId : null,
                    CityName = b.Address != null && b.Address.City != null ? b.Address.City.Name : null,
                    ScheduledAt = b.ScheduledAt,
                    Status = b.Status ?? string.Empty,
                    TotalAmount = b.TotalAmount,
                    PaymentStatus = b.PaymentStatus ?? string.Empty,
                    AddressId = b.AddressId,
                    AddressLine1 = b.Address != null ? b.Address.Line1 : null,
                    AddressLine2 = b.Address != null ? b.Address.Line2 : null,
                    Pincode = b.Address != null ? b.Address.Pincode : null,
                    Items = b.Items.Select(i => new AdminBookingItemDto
                    {
                        ServiceId = i.ServiceId,
                        ServiceName = i.Service != null ? i.Service.Title : null,
                        Price = i.Price,
                        DurationMinutes = i.DurationMinutes
                    }).ToList(),
                    CreatedAt = b.CreatedAt
                })
                .FirstOrDefaultAsync(ct);

            if (booking == null) return NotFound();
            return Ok(booking);
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("/api/admin/bookings/{id:guid}/status")]
        public async Task<IActionResult> UpdateAdminStatus(Guid id, [FromBody] AdminBookingStatusUpdateDto input, CancellationToken ct)
        {
            if (input == null || string.IsNullOrWhiteSpace(input.Status))
                return BadRequest("Status is required.");

            var booking = await _db.Bookings
                .Include(b => b.Professional)
                .FirstOrDefaultAsync(b => b.Id == id, ct);
            if (booking == null) return NotFound();

            var current = NormalizeStatus(booking.Status);
            var next = NormalizeStatus(input.Status);
            if (!IsValidAdminTransition(current, next))
                return BadRequest($"Invalid status transition from {current} to {next}.");

            booking.Status = next;
            booking.UpdatedAt = DateTime.UtcNow;

            if (string.Equals(next, "COMPLETED", StringComparison.OrdinalIgnoreCase) && booking.ProfessionalId.HasValue)
            {
                var professional = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == booking.ProfessionalId && !p.IsDeleted, ct);
                if (professional != null)
                {
                    professional.Earnings += booking.TotalAmount;
                    professional.UpdatedAt = DateTime.UtcNow;
                }
            }

            if (string.Equals(next, "CANCELLED", StringComparison.OrdinalIgnoreCase))
            {
                booking.IsDeleted = true;
            }

            await _db.SaveChangesAsync(ct);
            return Ok(new { booking.Id, booking.Status });
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("/api/admin/bookings/{id:guid}/assign-professional")]
        public async Task<IActionResult> AssignProfessional(Guid id, [FromBody] AdminBookingAssignDto input, CancellationToken ct)
        {
            if (input == null || input.ProfessionalId == Guid.Empty)
                return BadRequest("ProfessionalId is required.");

            var booking = await _db.Bookings
                .Include(b => b.Address)
                .FirstOrDefaultAsync(b => b.Id == id, ct);
            if (booking == null) return NotFound();

            var professional = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == input.ProfessionalId && !p.IsDeleted, ct);
            if (professional == null) return BadRequest("Professional not found.");

            if (booking.Address?.CityId.HasValue == true && professional.CityId.HasValue &&
                booking.Address.CityId.Value != professional.CityId.Value)
            {
                return BadRequest("Selected professional is not in the booking city.");
            }

            booking.ProfessionalId = professional.Id;
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok(new { booking.Id, booking.ProfessionalId });
        }

        private static AdminBookingDto MapAdminBooking(Booking booking)
        {
            var items = booking.Items?.Select(i => new AdminBookingItemDto
            {
                ServiceId = i.ServiceId,
                ServiceName = i.Service?.Title,
                Price = i.Price,
                DurationMinutes = i.DurationMinutes
            }).ToList() ?? new List<AdminBookingItemDto>();

            return new AdminBookingDto
            {
                Id = booking.Id,
                BookingReference = booking.BookingReference ?? string.Empty,
                UserId = booking.UserId,
                UserName = booking.User?.FullName,
                UserPhone = booking.User?.Phone,
                ProfessionalId = booking.ProfessionalId,
                ProfessionalName = booking.Professional?.DisplayName ?? booking.Professional?.User?.FullName,
                CityId = booking.Address?.CityId,
                CityName = booking.Address?.City?.Name,
                ScheduledAt = booking.ScheduledAt,
                Status = booking.Status ?? string.Empty,
                TotalAmount = booking.TotalAmount,
                PaymentStatus = booking.PaymentStatus ?? string.Empty,
                AddressId = booking.AddressId,
                AddressLine1 = booking.Address?.Line1,
                AddressLine2 = booking.Address?.Line2,
                Pincode = booking.Address?.Pincode,
                Items = items,
                CreatedAt = booking.CreatedAt
            };
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

            var requestedDurationMinutes = input.Items.Sum(i => i.DurationMinutes ?? 0);
            var requestedEnd = requestedDurationMinutes > 0
                ? input.ScheduledAt.AddMinutes(requestedDurationMinutes)
                : input.ScheduledAt.AddMinutes(1);

            var overlappingBookings = await _db.Bookings
                .Include(b => b.Items)
                .AsNoTracking()
                .Where(b =>
                    b.ProfessionalId == selectedProfessionalId.Value &&
                    !b.IsDeleted &&
                    b.Status != "REJECTED" &&
                    b.Status != "CANCELLED" &&
                    b.ScheduledAt < requestedEnd)
                .ToListAsync(ct);

            var hasOverlap = overlappingBookings.Any(b =>
            {
                var durationMinutes = b.Items.Sum(i => i.DurationMinutes ?? 0);
                var bookingEnd = durationMinutes > 0
                    ? b.ScheduledAt.AddMinutes(durationMinutes)
                    : b.ScheduledAt.AddMinutes(1);
                return b.ScheduledAt < requestedEnd && bookingEnd > input.ScheduledAt;
            });

            if (hasOverlap)
                return Conflict("Selected slot overlaps with an existing booking.");

            var slotReservation = await _slotService.TryReserveSlotAsync(selectedProfessionalId.Value, input.ScheduledAt, ct);
            if (!slotReservation.Success)
                return Conflict(slotReservation.Message);

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
            booking.Status = "CANCELLED";
            booking.IsDeleted = true;
            booking.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}

