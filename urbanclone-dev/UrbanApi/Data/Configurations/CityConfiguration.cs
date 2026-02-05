using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;
using System;

namespace UrbanApi.Data.Configurations
{
    public class CityConfiguration : IEntityTypeConfiguration<City>
    {
        public void Configure(EntityTypeBuilder<City> builder)
        {
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
            builder.Property(c => c.Slug).HasMaxLength(150);

            // seed
            builder.HasData(new City
            {
                Id = 1,
                Name = "Delhi NCR",
                Slug = "delhi-ncr",
                // replace DateTime.UtcNow with a fixed literal
                CreatedAt = new DateTime(2025, 11, 16, 0, 0, 0, DateTimeKind.Utc)
            });
        }
    }
}
