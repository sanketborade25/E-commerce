using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UrbanApi.Models;

namespace UrbanApi.Data.Configurations
{
    public class ProfessionalCategoryConfiguration : IEntityTypeConfiguration<ProfessionalCategory>
    {
        public void Configure(EntityTypeBuilder<ProfessionalCategory> builder)
        {
            builder.HasKey(pc => pc.Id);

            builder.HasOne(pc => pc.Professional)
                .WithMany(p => p.ProfessionalCategories)
                .HasForeignKey(pc => pc.ProfessionalId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pc => pc.Category)
                .WithMany()
                .HasForeignKey(pc => pc.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
