using System.Collections.Generic;

namespace UrbanApi.Models
{
    public class Category : BaseEntity
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
        public string? ImageUrl { get; set; }
        public int? ParentCategoryId { get; set; }

        // Navigation
        public Category? ParentCategory { get; set; }
        public ICollection<Category> ChildCategories { get; set; } = new List<Category>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
    }
}
