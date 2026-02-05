using System;

namespace UrbanApi.Dto
{
    public class BookingItemDto
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
    }

    public class BookingItemCreateDto
    {
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
    }
}
