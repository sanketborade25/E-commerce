using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class ServiceOptionConfiguration : IEntityTypeConfiguration<ServiceOption>
    {
        public void Configure(EntityTypeBuilder<ServiceOption> builder)
        {
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Price).HasPrecision(18, 2);

            builder.HasOne(o => o.Service)
                   .WithMany(s => s.Options)
                   .HasForeignKey(o => o.ServiceId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
