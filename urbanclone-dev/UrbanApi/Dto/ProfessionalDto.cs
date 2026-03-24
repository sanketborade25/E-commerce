using System;

namespace UrbanApi.Dto
{
    public class ProfessionalDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? DisplayName { get; set; }
        public string? Bio { get; set; }
        public bool IsOnline { get; set; }
        public decimal Rating { get; set; }
        public bool IsVerified { get; set; }
        public decimal Earnings { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public List<int> SkillCategoryIds { get; set; } = new List<int>();
    }

    public class ProfessionalCreateDto
    {
        public Guid UserId { get; set; }
        public string? DisplayName { get; set; }
        public int? CityId { get; set; }
    }

    public class ProfessionalOnlineStatusDto
    {
        public bool IsOnline { get; set; }
    }


    public class BookingStatusUpdateDto
    {
        public string Status { get; set; } = null!;
    }
}
