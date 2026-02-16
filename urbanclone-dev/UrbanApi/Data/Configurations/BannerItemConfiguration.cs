using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class BannerItemConfiguration : IEntityTypeConfiguration<BannerItem>
    {
        public void Configure(EntityTypeBuilder<BannerItem> builder)
        {
            builder.HasKey(b => b.Id);
            builder.Property(b => b.Section).IsRequired().HasMaxLength(80);
            builder.Property(b => b.Title).HasMaxLength(200);
            builder.Property(b => b.ImageUrl).HasMaxLength(1000);
            builder.Property(b => b.LinkUrl).HasMaxLength(1000);
        }
    }
}
