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
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public ReviewsController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        [HttpGet("professional/{proId:guid}")]
        public async Task<IActionResult> GetByProfessional(Guid proId, CancellationToken ct)
        {
            var list = await _db.Reviews.Where(r => r.ProfessionalId == proId && !r.IsDeleted).AsNoTracking().ToListAsync(ct);
            return Ok(_mapper.Map<List<ReviewDto>>(list));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReviewCreateDto input, CancellationToken ct)
        {
            var entity = _mapper.Map<Review>(input);
            _db.Reviews.Add(entity);
            await _db.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetByProfessional), new { proId = entity.ProfessionalId }, _mapper.Map<ReviewDto>(entity));
        }
    }
}
