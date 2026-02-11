using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using UrbanApi.Data;
using UrbanApi.Dto;
using UrbanApi.Models;

namespace UrbanApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IMapper _mapper;

        public CartController(AppDbContext db, IMapper mapper)
        {
            _db = db;
            _mapper = mapper;
        }

        private Guid GetUserId()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(sub) || !Guid.TryParse(sub, out var userId))
                throw new UnauthorizedAccessException("Invalid user id.");

            return userId;
        }

        private async Task<Cart> GetOrCreateCart(Guid userId, CancellationToken ct)
        {
            var cart = await _db.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId && !c.IsDeleted, ct);

            if (cart != null) return cart;

            cart = new Cart { UserId = userId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync(ct);
            return cart;
        }

        private CartDto ToDto(Cart cart)
        {
            var items = cart.Items.Where(i => !i.IsDeleted).ToList();
            var dto = _mapper.Map<CartDto>(cart);
            dto.Items = _mapper.Map<List<CartItemDto>>(items);
            dto.TotalItems = items.Sum(i => i.Quantity);
            dto.Subtotal = items.Sum(i => i.LineTotal);
            return dto;
        }

        [HttpGet]
        public async Task<IActionResult> Get(CancellationToken ct)
        {
            var userId = GetUserId();
            var cart = await GetOrCreateCart(userId, ct);
            return Ok(ToDto(cart));
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] CartItemCreateDto input, CancellationToken ct)
        {
            if (input == null || input.Quantity <= 0)
                return BadRequest("Quantity must be greater than 0.");

            var userId = GetUserId();
            var cart = await GetOrCreateCart(userId, ct);

            var service = await _db.Services.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == input.ServiceId && !s.IsDeleted, ct);
            if (service == null) return NotFound("Service not found.");

            ServiceOption? option = null;
            if (input.ServiceOptionId.HasValue)
            {
                option = await _db.ServiceOptions.AsNoTracking()
                    .FirstOrDefaultAsync(o => o.Id == input.ServiceOptionId.Value && !o.IsDeleted, ct);
                if (option == null || option.ServiceId != service.Id)
                    return BadRequest("Invalid service option.");
            }

            var unitPrice = input.UnitPrice.GetValueOrDefault();
            if (unitPrice <= 0)
                unitPrice = option?.Price ?? 0;

            var existing = await _db.CartItems
                .FirstOrDefaultAsync(i =>
                    i.CartId == cart.Id &&
                    i.ServiceId == input.ServiceId &&
                    i.ServiceOptionId == input.ServiceOptionId &&
                    !i.IsDeleted, ct);

            if (existing == null)
            {
                var item = new CartItem
                {
                    CartId = cart.Id,
                    ServiceId = input.ServiceId,
                    ServiceOptionId = input.ServiceOptionId,
                    Quantity = input.Quantity,
                    UnitPrice = unitPrice,
                    LineTotal = unitPrice * input.Quantity
                };
                _db.CartItems.Add(item);
            }
            else
            {
                existing.Quantity += input.Quantity;
                existing.UnitPrice = unitPrice;
                existing.LineTotal = existing.UnitPrice * existing.Quantity;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            cart = await GetOrCreateCart(userId, ct);
            return Ok(ToDto(cart));
        }

        [HttpPut("items/{id:int}")]
        public async Task<IActionResult> UpdateItem(int id, [FromBody] CartItemUpdateDto input, CancellationToken ct)
        {
            if (input == null) return BadRequest("Invalid payload.");

            var userId = GetUserId();
            var cart = await GetOrCreateCart(userId, ct);

            var item = await _db.CartItems
                .FirstOrDefaultAsync(i => i.Id == id && i.CartId == cart.Id && !i.IsDeleted, ct);
            if (item == null) return NotFound();

            if (input.Quantity <= 0)
            {
                item.IsDeleted = true;
                item.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                item.Quantity = input.Quantity;
                if (input.UnitPrice.HasValue && input.UnitPrice.Value > 0)
                    item.UnitPrice = input.UnitPrice.Value;
                item.LineTotal = item.UnitPrice * item.Quantity;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            cart = await GetOrCreateCart(userId, ct);
            return Ok(ToDto(cart));
        }

        [HttpDelete("items/{id:int}")]
        public async Task<IActionResult> RemoveItem(int id, CancellationToken ct)
        {
            var userId = GetUserId();
            var cart = await GetOrCreateCart(userId, ct);

            var item = await _db.CartItems
                .FirstOrDefaultAsync(i => i.Id == id && i.CartId == cart.Id && !i.IsDeleted, ct);
            if (item == null) return NotFound();

            item.IsDeleted = true;
            item.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            cart = await GetOrCreateCart(userId, ct);
            return Ok(ToDto(cart));
        }

        [HttpDelete("clear")]
        public async Task<IActionResult> Clear(CancellationToken ct)
        {
            var userId = GetUserId();
            var cart = await GetOrCreateCart(userId, ct);

            var items = await _db.CartItems
                .Where(i => i.CartId == cart.Id && !i.IsDeleted)
                .ToListAsync(ct);

            foreach (var item in items)
            {
                item.IsDeleted = true;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);
            cart = await GetOrCreateCart(userId, ct);
            return Ok(ToDto(cart));
        }
    }
}
