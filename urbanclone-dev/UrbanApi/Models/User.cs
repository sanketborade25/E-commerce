using System;
using System.Collections.Generic;
using System.Net;
using System.Reflection.Metadata;

namespace UrbanApi.Models
{
    public class User : BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string? PasswordHash { get; set; }
        public string Role { get; set; } = "Customer";

        // Navigation
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
    }
}
