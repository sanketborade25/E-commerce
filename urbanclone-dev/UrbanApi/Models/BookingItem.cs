namespace UrbanApi.Models
{
    public class BookingItem : BaseEntity
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }

        public Booking Booking { get; set; } = null!;
        public Service Service { get; set; } = null!;
        public ServiceOption? ServiceOption { get; set; }
    }
}
