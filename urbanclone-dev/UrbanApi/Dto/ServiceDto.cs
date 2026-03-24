namespace UrbanApi.Dto
{
    public class ServiceCityStatusDto
    {
        public int CityId { get; set; }
        public string? CityName { get; set; }
        public bool IsEnabled { get; set; }
    }

    public class ServiceDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public int? CityId { get; set; }
        public string Title { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public bool IsActive { get; set; }

        public string GlobalStatus => IsActive ? "enabled" : "disabled";
        public bool IsVisible { get; set; }
        public bool IsBookable { get; set; }
        public int PartnerCount { get; set; }
        public int AvailableSlots { get; set; }
        public List<ServiceCityStatusDto> CityStatuses { get; set; } = new List<ServiceCityStatusDto>();
    }

    public class ServiceCreateDto
    {
        public int CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public int? CityId { get; set; }
        public string Title { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
