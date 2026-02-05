namespace UrbanApi.Models
{
    public class Document : BaseEntity
    {
        public int Id { get; set; }
        public Guid? ProfessionalId { get; set; }
        public Guid? UserId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public string? DocumentType { get; set; }

        public Professional? Professional { get; set; }
        public User? User { get; set; }
    }
}
