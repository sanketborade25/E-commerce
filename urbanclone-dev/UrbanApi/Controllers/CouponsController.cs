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
    public class CouponsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public CouponsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> Validate(string code, CancellationToken ct)
        {
            var coupon = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == code && c.IsActive, ct);
            if (coupon == null) return NotFound();
            return Ok(_mapper.Map<CouponDto>(coupon));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CouponCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Coupon>(input);
            _db.Coupons.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(Validate), new { code = entity.Code }, _mapper.Map<CouponDto>(entity));
        }
    }
}
