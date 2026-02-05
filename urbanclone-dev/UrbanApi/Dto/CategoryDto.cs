namespace UrbanApi.Dto
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
        public string? ImageUrl { get; set; }
        public int? ParentCategoryId { get; set; }
    }

    public class CategoryCreateDto
    {
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
        public string? ImageUrl { get; set; }
        public int? ParentCategoryId { get; set; }
    }
}
