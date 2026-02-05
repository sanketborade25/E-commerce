using System;
using System.Collections.Generic;
using System.Reflection.Metadata;

namespace UrbanApi.Models
{
    public class Professional : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public string? DisplayName { get; set; }
        public string? Bio { get; set; }
        public decimal Rating { get; set; } = 0m;
        public bool IsVerified { get; set; } = false;
        public int? CityId { get; set; }

        // Navigation
        public User User { get; set; } = null!;
        public City? City { get; set; }
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}
