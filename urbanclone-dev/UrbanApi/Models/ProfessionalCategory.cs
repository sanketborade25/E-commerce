using System;

namespace UrbanApi.Models
{
    public class ProfessionalCategory : BaseEntity
    {
        public int Id { get; set; }
        public Guid ProfessionalId { get; set; }
        public int CategoryId { get; set; }

        public Professional Professional { get; set; } = null!;
        public Category Category { get; set; } = null!;
    }
}
