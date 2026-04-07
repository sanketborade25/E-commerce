using AutoMapper;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfessionalsController : ControllerBase
    {
        private static readonly string[] UpcomingStatuses = ["PENDING", "ASSIGNED", "ACCEPTED"];
        private static readonly string[] OngoingStatuses = ["ON_THE_WAY", "STARTED"];
        private static readonly string[] CompletedStatuses = ["COMPLETED"];

        private readonly AppDbContext _db;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;

        public ProfessionalsController(AppDbContext db, IMapper mapper, IConfiguration config)
        {
            _db = db;
            _mapper = mapper;
            _config = config;
        }

        private static string HashPassword(string plain)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(plain));
            return Convert.ToHexString(bytes);
        }

        private string CreateToken(User user)
        {
            var jwtSection = _config.GetSection("Jwt");
            var key = jwtSection.GetValue<string>("Key") ?? throw new InvalidOperationException("Jwt:Key missing");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expiresIn = jwtSection.GetValue<int?>("ExpiresInMinutes") ?? 1440;

            var keyBytes = Encoding.UTF8.GetBytes(key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(expiresIn);
            var role = NormalizeRole(user.Role);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Phone),
                new Claim("name", user.FullName ?? string.Empty),
                new Claim("role", role),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string NormalizeRole(string? role)
        {
            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase)) return "Admin";
            if (string.Equals(role, "professional", StringComparison.OrdinalIgnoreCase)) return "Professional";
            return "User";
        }

        private async Task<(User user, Professional professional)?> GetCurrentProfessionalAsync(CancellationToken ct, bool tracked = false)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId)) return null;

            var query = _db.Professionals
                .Include(p => p.User)
                .Include(p => p.City)
                .Where(p => p.UserId == userId && !p.IsDeleted);

            Professional? professional = tracked
                ? await query.FirstOrDefaultAsync(ct)
                : await query.AsNoTracking().FirstOrDefaultAsync(ct);

            if (professional?.User == null) return null;
            return (professional.User, professional);
        }

        private static string NormalizeBookingStatus(string? status)
        {
            return string.IsNullOrWhiteSpace(status) ? "PENDING" : status.Trim().ToUpperInvariant();
        }

        private static string[] ResolveStatusFilter(string? status)
        {
            return NormalizeBookingStatus(status) switch
            {
                "UPCOMING" => UpcomingStatuses,
                "ONGOING" => OngoingStatuses,
                "COMPLETED" => CompletedStatuses,
                _ => []
            };
        }

        private static ProfessionalProfileDto MapProfessionalProfile(User user, Professional professional)
        {
            return new ProfessionalProfileDto
            {
                Id = professional.Id,
                UserId = professional.UserId,
                FullName = user.FullName,
                DisplayName = professional.DisplayName,
                Email = user.Email,
                Phone = user.Phone,
                IsOnline = professional.IsOnline,
                Rating = professional.Rating,
                Earnings = professional.Earnings,
                IsVerified = professional.IsVerified,
                CityId = professional.CityId,
                CityName = professional.City?.Name
            };
        }

        [AllowAnonymous]
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] ProfessionalSignupRequest input, CancellationToken ct)
        {
            if (input == null) return BadRequest("Invalid payload.");
            if (string.IsNullOrWhiteSpace(input.FullName) ||
                string.IsNullOrWhiteSpace(input.Phone) ||
                string.IsNullOrWhiteSpace(input.Password))
            {
                return BadRequest("Full name, phone, and password are required.");
            }

            var existingUser = await _db.Users.AnyAsync(u => u.Phone == input.Phone && !u.IsDeleted, ct);
            if (existingUser) return Conflict("A professional with this phone number already exists.");

            var user = new User
            {
                FullName = input.FullName.Trim(),
                Email = string.IsNullOrWhiteSpace(input.Email) ? null : input.Email.Trim(),
                Phone = input.Phone.Trim(),
                PasswordHash = HashPassword(input.Password),
                Role = "Professional"
            };

            var professional = new Professional
            {
                User = user,
                DisplayName = string.IsNullOrWhiteSpace(input.DisplayName) ? input.FullName.Trim() : input.DisplayName.Trim(),
                CityId = input.CityId,
                IsOnline = false
            };

            _db.Users.Add(user);
            _db.Professionals.Add(professional);
            await _db.SaveChangesAsync(ct);

            var token = CreateToken(user);
            return Ok(new LoginResponse
            {
                AccessToken = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_config.GetSection("Jwt").GetValue<int?>("ExpiresInMinutes") ?? 1440),
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Role = "Professional"
                }
            });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Email or phone and password are required.");

            var email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim().ToLowerInvariant();
            var phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();
            if (email == null && phone == null)
                return BadRequest("Email or phone and password are required.");

            var user = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    !u.IsDeleted &&
                    ((email != null && u.Email != null && u.Email.ToLower() == email) ||
                     (phone != null && u.Phone == phone)), ct);
            if (user == null) return Unauthorized("Invalid email or password.");

            var hashed = HashPassword(req.Password);
            if (!string.Equals(hashed, user.PasswordHash ?? string.Empty, StringComparison.OrdinalIgnoreCase))
                return Unauthorized("Invalid email or password.");

            var hasProfessionalProfile = await _db.Professionals.AnyAsync(p => p.UserId == user.Id && !p.IsDeleted, ct);
            if (!hasProfessionalProfile) return NotFound("Professional profile not found.");

            user.Role = "Professional";
            var token = CreateToken(user);

            return Ok(new LoginResponse
            {
                AccessToken = token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_config.GetSection("Jwt").GetValue<int?>("ExpiresInMinutes") ?? 1440),
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Role = "Professional"
                }
            });
        }

        [Authorize(Roles = "Admin")]
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? cityId, CancellationToken ct)
        {
            var q = _db.Professionals.Where(p => !p.IsDeleted);
            if (cityId.HasValue) q = q.Where(p => p.CityId == cityId.Value);
            var list = await q.AsNoTracking().ToListAsync(ct);
            // Custom mapping to include status/verificationStatus
            var result = list.Select(p => MapProfessionalAdminDto(p)).ToList();
            return Ok(result);
        }
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] ProfessionalStatusUpdateDto input, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = !input.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(MapProfessionalAdminDto(entity));
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id:guid}/verification")]
        public async Task<IActionResult> UpdateVerification(Guid id, [FromBody] ProfessionalVerificationUpdateDto input, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (entity == null) return NotFound();
            entity.IsVerified = input.IsVerified;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(MapProfessionalAdminDto(entity));
        }
        // Helper for admin DTO mapping
        private static ProfessionalAdminDto MapProfessionalAdminDto(Professional p)
        {
            return new ProfessionalAdminDto
            {
                Id = p.Id,
                UserId = p.UserId,
                DisplayName = p.DisplayName,
                Bio = p.Bio,
                IsOnline = p.IsOnline,
                Rating = p.Rating,
                IsVerified = p.IsVerified,
                Earnings = p.Earnings,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                CityId = p.CityId,
                CityName = p.City?.Name,
                SkillCategoryIds = p.ProfessionalCategories?.Select(pc => pc.CategoryId).ToList() ?? new List<int>(),
                Status = p.IsDeleted ? "Inactive" : "Active",
                VerificationStatus = p.IsVerified ? "Approved" : "Pending"
            };
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var pro = await _db.Professionals.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (pro == null) return NotFound();
            return Ok(_mapper.Map<ProfessionalDto>(pro));
        }

        [Authorize(Roles = "Professional")]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile(CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct);
            if (professional == null) return Forbid();

            return Ok(MapProfessionalProfile(professional.Value.user, professional.Value.professional));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMe(CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct);
            if (professional == null) return Forbid();

            return Ok(_mapper.Map<ProfessionalDto>(professional.Value.professional));
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProfessionalCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Professional>(input);
            _db.Professionals.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<ProfessionalDto>(entity));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ProfessionalCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (entity == null) return NotFound();
            _mapper.Map(input, entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [Authorize(Roles = "Professional")]
        [HttpPatch("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] ProfessionalOnlineStatusDto input, CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct, tracked: true);
            if (professional == null) return Forbid();

            professional.Value.professional.IsOnline = input.IsOnline;
            professional.Value.professional.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return Ok(MapProfessionalProfile(professional.Value.user, professional.Value.professional));
        }

        [Authorize]
        [HttpPatch("me/online")]
        public async Task<IActionResult> SetMyOnlineStatus([FromBody] ProfessionalOnlineStatusDto input, CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct, tracked: true);
            if (professional == null) return Forbid();

            professional.Value.professional.IsOnline = input.IsOnline;
            professional.Value.professional.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [Authorize(Roles = "Professional")]
        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookings([FromQuery] string? status, CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct);
            if (professional == null) return Forbid();

            var statuses = ResolveStatusFilter(status);

            var query = _db.Bookings
                .Where(b => b.ProfessionalId == professional.Value.professional.Id && !b.IsDeleted);

            if (statuses.Length > 0)
            {
                query = query.Where(b => statuses.Contains(b.Status.ToUpper()));
            }

            var result = await query
                .OrderBy(b => b.ScheduledAt)
                .AsNoTracking()
                .Select(b => new ProfessionalBookingSummaryDto
                {
                    Id = b.Id,
                    BookingReference = b.BookingReference,
                    Status = NormalizeBookingStatus(b.Status),
                    ScheduledAt = b.ScheduledAt,
                    TotalAmount = b.TotalAmount,
                    PaymentStatus = b.PaymentStatus,
                    ServiceName = b.Items
                        .Select(i => i.Service != null ? i.Service.Title : null)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct()
                        .FirstOrDefault() ?? "General service",
                    ServiceNames = b.Items
                        .Select(i => i.Service != null ? i.Service.Title : null)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Select(name => name!)
                        .Distinct()
                        .ToList(),
                    ItemCount = b.Items.Count
                })
                .ToListAsync(ct);

            return Ok(result);
        }

        [Authorize(Roles = "Professional")]
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard(CancellationToken ct)
        {
            var professional = await GetCurrentProfessionalAsync(ct);
            if (professional == null) return Forbid();

            var normalizedStatuses = await _db.Bookings
                .Where(b => b.ProfessionalId == professional.Value.professional.Id && !b.IsDeleted)
                .Select(b => b.Status)
                .AsNoTracking()
                .ToListAsync(ct);

            normalizedStatuses = normalizedStatuses.Select(NormalizeBookingStatus).ToList();

            var dto = new ProfessionalDashboardDto
            {
                Rating = professional.Value.professional.Rating,
                Earnings = professional.Value.professional.Earnings,
                TotalBookings = normalizedStatuses.Count,
                UpcomingBookings = normalizedStatuses.Count(UpcomingStatuses.Contains),
                OngoingBookings = normalizedStatuses.Count(OngoingStatuses.Contains),
                CompletedBookings = normalizedStatuses.Count(CompletedStatuses.Contains),
                NotificationCount = normalizedStatuses.Count(statusValue => statusValue == "PENDING" || statusValue == "ASSIGNED")
            };

            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var entity = await _db.Professionals.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
