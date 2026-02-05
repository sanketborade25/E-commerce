namespace UrbanApi.Dto
{
    public class ServiceOptionDto
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
    }

    public class ServiceOptionCreateDto
    {
        public int ServiceId { get; set; }
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
    }
}
