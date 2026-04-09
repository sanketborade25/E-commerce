namespace UrbanApi.Dto
{
    public class LoginRequest
    {
        public string? Identifier { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; } = null!;
    }

    public class LoginResponse
    {
        public string AccessToken { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; } = null!;
    }
}
