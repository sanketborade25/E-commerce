namespace UrbanApi.Models
{
    public class Address : BaseEntity
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public int? CityId { get; set; }
        public string? Pincode { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public bool IsDefault { get; set; } = false;

        public User User { get; set; } = null!;
        public City? City { get; set; }
    }
}
