using System;

namespace UrbanApi.Dto
{
    public class CouponDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public bool IsActive { get; set; }
    }

    public class CouponCreateDto
    {
        public string Code { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
    }
}
