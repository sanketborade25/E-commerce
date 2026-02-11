namespace UrbanApi.Dto
{
    public class ServiceDto
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public int? CityId { get; set; }
        public string Title { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class ServiceCreateDto
    {
        public int CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public int? CityId { get; set; }
        public string Title { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
