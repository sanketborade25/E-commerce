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
            builder.Property(s => s.BasePrice).HasPrecision(18, 2);
            builder.Property(s => s.ShortDescription).HasMaxLength(500);

            builder.HasOne(s => s.Category)
                   .WithMany(c => c.Services)
                   .HasForeignKey(s => s.CategoryId)
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
                CityId = 1,
                Title = "Leakage Repair",
                ShortDescription = "Fix home leakages",
                LongDescription = "Basic leakage repair service for taps, pipelines.",
                BasePrice = 499.00m,
                DurationMinutes = 60,
                IsActive = true,
                CreatedAt = new DateTime(2025, 11, 16, 0, 0, 0, DateTimeKind.Utc)
            });
        }
    }
}
