using System;
using System.Collections.Generic;

namespace UrbanApi.Dto
{
    public class AdminBookingItemDto
    {
        public int ServiceId { get; set; }
        public string? ServiceName { get; set; }
        public decimal Price { get; set; }
        public int? DurationMinutes { get; set; }
    }

    public class AdminBookingDto
    {
        public Guid Id { get; set; }
        public string BookingReference { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserPhone { get; set; }
        public Guid? ProfessionalId { get; set; }
        public string? ProfessionalName { get; set; }
        public int? CityId { get; set; }
        public string? CityName { get; set; }
        public DateTime ScheduledAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public int? AddressId { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Pincode { get; set; }
        public List<AdminBookingItemDto> Items { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class AdminBookingListResponse
    {
        public List<AdminBookingDto> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class AdminBookingStatusUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AdminBookingAssignDto
    {
        public Guid ProfessionalId { get; set; }
    }
}
