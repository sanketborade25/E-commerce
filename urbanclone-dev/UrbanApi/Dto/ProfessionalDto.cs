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
        public string Status { get; set; } = "Active";
        public string VerificationStatus { get; set; } = "Pending";
    }

    public class ProfessionalAdminDto : ProfessionalDto
    {
    }

    public class ProfessionalStatusUpdateDto
    {
        public bool IsActive { get; set; }
    }

    public class ProfessionalVerificationUpdateDto
    {
        public bool IsVerified { get; set; }
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

    public class ProfessionalSignupRequest
    {
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int? CityId { get; set; }
        public string? DisplayName { get; set; }
    }

    public class ProfessionalProfileDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public bool IsOnline { get; set; }
        public decimal Rating { get; set; }
        public decimal Earnings { get; set; }
        public bool IsVerified { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
    }

    public class ProfessionalDashboardDto
    {
        public decimal Rating { get; set; }
        public decimal Earnings { get; set; }
        public int TotalBookings { get; set; }
        public int UpcomingBookings { get; set; }
        public int OngoingBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int NotificationCount { get; set; }
    }

    public class ProfessionalBookingSummaryDto
    {
        public Guid Id { get; set; }
        public string BookingReference { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime ScheduledAt { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string ServiceName { get; set; } = null!;
        public List<string> ServiceNames { get; set; } = new();
        public int ItemCount { get; set; }
    }

    public class BookingStatusUpdateDto
    {
        public string Status { get; set; } = null!;
    }
}
