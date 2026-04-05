using System;

namespace UrbanApi.Dto
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string Role { get; set; } = "User";
        public bool IsActive { get; set; }
    }

    public class UserCreateDto
    {
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string Phone { get; set; } = null!;
        public string? Password { get; set; } // raw password; controller should hash it
        public string? Role { get; set; } // optional; only Admin is honored
    }

    public class UserStatusUpdateDto
    {
        public bool IsActive { get; set; }
    }
}
