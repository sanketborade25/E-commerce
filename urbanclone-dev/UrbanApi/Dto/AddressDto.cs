using System;

namespace UrbanApi.Dto
{
    public class AddressDto
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public int? CityId { get; set; }
        public string? Pincode { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public bool IsDefault { get; set; }
    }

    public class AddressCreateDto
    {
        public Guid UserId { get; set; }
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public int? CityId { get; set; }
        public string? Pincode { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public bool IsDefault { get; set; }
    }
}
