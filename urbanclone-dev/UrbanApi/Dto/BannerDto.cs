namespace UrbanApi.Dto
{
    public class BannerDto
    {
        public int Id { get; set; }
        public string Section { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class BannerCreateDto
    {
        public string Section { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? ImageUrl { get; set; }
        public string? LinkUrl { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
