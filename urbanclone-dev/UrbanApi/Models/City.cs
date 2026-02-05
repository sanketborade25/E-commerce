using System.Collections.Generic;
using System.Net;

namespace UrbanApi.Models
{
    public class City : BaseEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }

        // Navigation
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<Professional> Professionals { get; set; } = new List<Professional>();
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
    }
}
