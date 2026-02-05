using System;

namespace UrbanApi.Dto
{
    public class ProfessionalDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? DisplayName { get; set; }
        public decimal Rating { get; set; }
        public bool IsVerified { get; set; }
        public int? CityId { get; set; }
    }

    public class ProfessionalCreateDto
    {
        public Guid UserId { get; set; }
        public string? DisplayName { get; set; }
        public int? CityId { get; set; }
    }
}
