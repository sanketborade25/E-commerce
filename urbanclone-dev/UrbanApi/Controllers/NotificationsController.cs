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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public NotificationsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("user/{userId:guid}")]
        public async Task<IActionResult> GetByUser(Guid userId, CancellationToken ct)
        {
            var list = await _db.Notifications.Where(n => n.UserId == userId && !n.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<NotificationDto>>(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NotificationCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Notification>(input);
            _db.Notifications.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByUser), new { userId = entity.UserId }, _mapper.Map<NotificationDto>(entity));
        }
    }
}
