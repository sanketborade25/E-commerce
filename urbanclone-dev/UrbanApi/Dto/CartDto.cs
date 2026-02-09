using System;
using System.Collections.Generic;

namespace UrbanApi.Dto
{
    public class CartDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
        public int TotalItems { get; set; }
        public decimal Subtotal { get; set; }
    }

    public class CartItemDto
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class CartItemCreateDto
    {
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal? UnitPrice { get; set; }
    }

    public class CartItemUpdateDto
    {
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
    }
}
