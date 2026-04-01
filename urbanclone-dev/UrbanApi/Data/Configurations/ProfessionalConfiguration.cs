using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class ProfessionalConfiguration : IEntityTypeConfiguration<Professional>
    {
        public void Configure(EntityTypeBuilder<Professional> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Rating).HasPrecision(3, 2);
            builder.Property(p => p.Earnings).HasPrecision(18, 2);
            builder.Property(p => p.Latitude).HasPrecision(9, 6);
            builder.Property(p => p.Longitude).HasPrecision(9, 6);

            builder.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.City)
                .WithMany(c => c.Professionals)
                .HasForeignKey(p => p.CityId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
