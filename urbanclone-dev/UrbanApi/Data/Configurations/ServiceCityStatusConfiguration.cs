using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class ServiceCityStatusConfiguration : IEntityTypeConfiguration<ServiceCityStatus>
    {
        public void Configure(EntityTypeBuilder<ServiceCityStatus> builder)
        {
            builder.HasKey(s => s.Id);

            builder.HasIndex(s => new { s.ServiceId, s.CityId }).IsUnique();

            builder.HasOne(s => s.Service)
                   .WithMany(svc => svc.CityStatuses)
                   .HasForeignKey(s => s.ServiceId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.City)
                   .WithMany(city => city.ServiceStatuses)
                   .HasForeignKey(s => s.CityId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(s => s.IsEnabled).HasDefaultValue(true);
        }
    }
}
