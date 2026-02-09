namespace UrbanApi.Models
{
    public class CartItem : BaseEntity
    {
        public int Id { get; set; }
        public Guid CartId { get; set; }
        public int ServiceId { get; set; }
        public int? ServiceOptionId { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        // Navigation
        public Cart Cart { get; set; } = null!;
        public Service Service { get; set; } = null!;
        public ServiceOption? ServiceOption { get; set; }
    }
}
