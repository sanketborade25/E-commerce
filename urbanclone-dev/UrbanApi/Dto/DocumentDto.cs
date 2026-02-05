using System;

namespace UrbanApi.Dto
{
    public class DocumentDto
    {
        public int Id { get; set; }
        public Guid? ProfessionalId { get; set; }
        public Guid? UserId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public string? DocumentType { get; set; }
    }

    public class DocumentCreateDto
    {
        public Guid? ProfessionalId { get; set; }
        public Guid? UserId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public string? DocumentType { get; set; }
    }
}
