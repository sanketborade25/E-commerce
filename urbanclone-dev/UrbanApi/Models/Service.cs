using System.Collections.Generic;

namespace UrbanApi.Models
{
    public class Service : BaseEntity
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public int? CityId { get; set; }

        public string Title { get; set; } = null!;
        public string? ShortDescription { get; set; }
        public string? LongDescription { get; set; }
        public string? ImageUrl { get; set; }
        public decimal BasePrice { get; set; }
        public int? DurationMinutes { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation
        public Category Category { get; set; } = null!;
        public City? City { get; set; }
        public ICollection<ServiceOption> Options { get; set; } = new List<ServiceOption>();
        public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
    }
}
