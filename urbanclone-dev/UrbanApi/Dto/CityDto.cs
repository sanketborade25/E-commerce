namespace UrbanApi.Dto
{
    public class CityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
    }

    public class CityCreateDto
    {
        public string Name { get; set; } = null!;
        public string? Slug { get; set; }
    }
}
