using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;

        public AuthController(AppDbContext db, IConfiguration config, IMapper mapper)
        {
            _db = db;
            _config = config;
            _mapper = mapper;
        }

        // helper: same SHA256 hex hashing used in UsersController
        private static string HashPassword(string plain)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(plain));
            return Convert.ToHexString(bytes);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Phone) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest("Phone and password are required.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Phone == req.Phone && !u.IsDeleted, ct);
            if (user == null) return Unauthorized("Invalid phone or password.");

            var hashed = HashPassword(req.Password);
            if (!string.Equals(hashed, user.PasswordHash ?? string.Empty, StringComparison.OrdinalIgnoreCase))
                return Unauthorized("Invalid phone or password.");

            // build token
            // inside AuthController after user validation — copy this block exactly
            var jwtSection = _config.GetSection("Jwt");
            var key = jwtSection.GetValue<string>("Key") ?? throw new InvalidOperationException("Jwt:Key missing");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expiresIn = jwtSection.GetValue<int?>("ExpiresInMinutes") ?? 1440;

            var keyBytes = System.Text.Encoding.UTF8.GetBytes(key);
            var creds = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);

            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(expiresIn);
            var role = string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role;
            if (string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
                role = "Admin";

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Phone),
                new Claim("name", user.FullName ?? string.Empty),
                new Claim("role", role),
                new Claim(ClaimTypes.Role, role)
            };
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: creds);
            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            var response = new LoginResponse
            {
                AccessToken = tokenString,
                ExpiresAt = expires,
                User = _mapper.Map<UserDto>(user)
            };

            return Ok(response);
        }
    }
}
