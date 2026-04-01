using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class AvailabilityConfiguration : IEntityTypeConfiguration<Availability>
    {
        public void Configure(EntityTypeBuilder<Availability> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Status)
                .HasMaxLength(24)
                .HasDefaultValue("available");
            builder.Property(a => a.Date)
                .HasColumnType("date");
            builder.HasIndex(a => new { a.ProfessionalId, a.Date, a.Status });

            builder.HasOne(a => a.Professional)
                .WithMany(p => p.Availabilities)
                .HasForeignKey(a => a.ProfessionalId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
