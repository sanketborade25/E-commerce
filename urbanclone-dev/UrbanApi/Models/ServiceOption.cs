namespace UrbanApi.Models
{
    public class ServiceOption : BaseEntity
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }

        public Service Service { get; set; } = null!;
    }
}
