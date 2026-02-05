using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class BookingConfiguration : IEntityTypeConfiguration<Booking>
    {
        public void Configure(EntityTypeBuilder<Booking> builder)
        {
            builder.HasKey(b => b.Id);
            builder.Property(b => b.TotalAmount).HasPrecision(18, 2);

            builder.HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(b => b.Professional)
                .WithMany(p => p.Bookings)
                .HasForeignKey(b => b.ProfessionalId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.Address)
                .WithMany()
                .HasForeignKey(b => b.AddressId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
