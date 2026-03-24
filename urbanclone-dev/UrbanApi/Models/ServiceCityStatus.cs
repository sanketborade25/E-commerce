namespace UrbanApi.Models
{
    public class ServiceCityStatus : BaseEntity
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public int CityId { get; set; }
        public bool IsEnabled { get; set; } = true;

        public Service Service { get; set; } = null!;
        public City City { get; set; } = null!;
    }
}
