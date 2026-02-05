using System;

namespace UrbanApi.Dto
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public Guid BookingId { get; set; }
        public Guid ProfessionalId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class ReviewCreateDto
    {
        public Guid BookingId { get; set; }
        public Guid ProfessionalId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
