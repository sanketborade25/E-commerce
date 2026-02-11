using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;
using System;

namespace UrbanApi.Data.Configurations
{
    public class ServiceConfiguration : IEntityTypeConfiguration<Service>
    {
        public void Configure(EntityTypeBuilder<Service> builder)
        {
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Title).IsRequired().HasMaxLength(200);

            builder.HasOne(s => s.Category)
                   .WithMany(c => c.Services)
                   .HasForeignKey(s => s.CategoryId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.SubCategory)
                   .WithMany()
                   .HasForeignKey(s => s.SubCategoryId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.City)
                   .WithMany(c => c.Services)
                   .HasForeignKey(s => s.CityId)
                   .OnDelete(DeleteBehavior.SetNull);

            // seed - simple example linking to seeded category & city
            builder.HasData(new Service
            {
                Id = 1,
                CategoryId = 1,
                SubCategoryId = null,
                CityId = 1,
                Title = "Leakage Repair",
                LongDescription = "Basic leakage repair service for taps, pipelines.",
                IsActive = true,
                CreatedAt = new DateTime(2025, 11, 16, 0, 0, 0, DateTimeKind.Utc)
            });
        }
    }
}
