using System;
using System.Collections.Generic;

namespace UrbanApi.Dto
{
    public class PartnerSignupRequest
    {
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string Password { get; set; } = null!;
        public int? CityId { get; set; }
        public string? DisplayName { get; set; }
    }

    public class PartnerProfileDto
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

    public class PartnerDashboardDto
    {
        public decimal Rating { get; set; }
        public decimal Earnings { get; set; }
        public int TotalBookings { get; set; }
        public int UpcomingBookings { get; set; }
        public int OngoingBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int NotificationCount { get; set; }
    }

    public class PartnerBookingDto
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
}
