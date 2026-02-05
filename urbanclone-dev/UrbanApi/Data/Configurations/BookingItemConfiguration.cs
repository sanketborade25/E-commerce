using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class BookingItemConfiguration : IEntityTypeConfiguration<BookingItem>
    {
        public void Configure(EntityTypeBuilder<BookingItem> builder)
        {
            builder.HasKey(bi => bi.Id);
            builder.Property(bi => bi.Price).HasPrecision(18, 2);

            builder.HasOne(bi => bi.Booking)
                .WithMany(b => b.Items)
                .HasForeignKey(bi => bi.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(bi => bi.Service)
                .WithMany(s => s.BookingItems)
                .HasForeignKey(bi => bi.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(bi => bi.ServiceOption)
                .WithMany()
                .HasForeignKey(bi => bi.ServiceOptionId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
