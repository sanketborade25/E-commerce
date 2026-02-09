using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class CartConfiguration : IEntityTypeConfiguration<Cart>
    {
        public void Configure(EntityTypeBuilder<Cart> builder)
        {
            builder.HasKey(c => c.Id);
            builder.HasIndex(c => c.UserId);

            builder.HasOne(c => c.User)
                   .WithMany(u => u.Carts)
                   .HasForeignKey(c => c.UserId)
                   .OnDelete(DeleteBehavior.NoAction);

            builder.HasMany(c => c.Items)
                   .WithOne(i => i.Cart)
                   .HasForeignKey(i => i.CartId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
