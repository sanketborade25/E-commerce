using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
    {
        public void Configure(EntityTypeBuilder<CartItem> builder)
        {
            builder.HasKey(i => i.Id);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Service)
                   .WithMany()
                   .HasForeignKey(i => i.ServiceId)
                   .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(i => i.ServiceOption)
                   .WithMany()
                   .HasForeignKey(i => i.ServiceOptionId)
                   .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
