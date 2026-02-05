using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
    //[Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public UsersController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        // simple SHA256 hashing for demo (replace with a proper password hasher later)
        private static string HashPassword(string plain)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(plain));
            return Convert.ToHexString(bytes);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(CancellationToken ct)
        {
            var list = await _db.Users.Where(u => !u.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<UserDto>>(list));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
            if (user == null) return NotFound();
            return Ok(_mapper.Map<UserDto>(user));
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<User>(input);
            if (!string.IsNullOrWhiteSpace(input.Password))
            {
                entity.PasswordHash = HashPassword(input.Password);
            }
            var role = input.Role?.Trim();
            if (!string.IsNullOrWhiteSpace(role))
            {
                entity.Role = role;
            }
            _db.Users.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Get), new { id = entity.Id }, _mapper.Map<UserDto>(entity));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UserCreateDto input, CancellationToken ct)
        {
            var entity = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
            if (entity == null) return NotFound();

            // update allowed fields
            entity.FullName = input.FullName;
            entity.Email = input.Email;
            entity.Phone = input.Phone;
            if (!string.IsNullOrWhiteSpace(input.Password)) entity.PasswordHash = HashPassword(input.Password);
            if (!string.IsNullOrWhiteSpace(input.Role)) entity.Role = input.Role!;

            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var entity = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted, ct);
            if (entity == null) return NotFound();
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }
    }
}
