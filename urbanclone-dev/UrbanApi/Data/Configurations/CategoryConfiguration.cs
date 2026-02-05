using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;
using System;

namespace UrbanApi.Data.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Name).IsRequired().HasMaxLength(100);

            // seed
            builder.HasData(new Category
            {
                Id = 1,
                Name = "Plumbing",
                Slug = "plumbing",
                CreatedAt = new DateTime(2025, 11, 16, 0, 0, 0, DateTimeKind.Utc)
            });
        }
    }
}
