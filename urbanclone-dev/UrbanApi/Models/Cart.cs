using System;
using System.Collections.Generic;

namespace UrbanApi.Models
{
    public class Cart : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
    }
}
