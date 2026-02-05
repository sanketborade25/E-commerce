using Microsoft.EntityFrameworkCore;
using UrbanApi.Models;
using UrbanApi.Data.Configurations;

namespace UrbanApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // DbSets
        public DbSet<City> Cities { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<Service> Services { get; set; } = null!;
        public DbSet<ServiceOption> ServiceOptions { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Professional> Professionals { get; set; } = null!;
        public DbSet<Address> Addresses { get; set; } = null!;
        public DbSet<Booking> Bookings { get; set; } = null!;
        public DbSet<BookingItem> BookingItems { get; set; } = null!;
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Review> Reviews { get; set; } = null!;
        public DbSet<Availability> Availabilities { get; set; } = null!;
        public DbSet<Document> Documents { get; set; } = null!;
        public DbSet<Coupon> Coupons { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // apply configurations
            modelBuilder.ApplyConfiguration(new CityConfiguration());
            modelBuilder.ApplyConfiguration(new CategoryConfiguration());
            modelBuilder.ApplyConfiguration(new ServiceConfiguration());
            modelBuilder.ApplyConfiguration(new ServiceOptionConfiguration());
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new ProfessionalConfiguration());
            modelBuilder.ApplyConfiguration(new AddressConfiguration());
            modelBuilder.ApplyConfiguration(new BookingConfiguration());
            modelBuilder.ApplyConfiguration(new BookingItemConfiguration());
            modelBuilder.ApplyConfiguration(new PaymentConfiguration());
            modelBuilder.ApplyConfiguration(new ReviewConfiguration());
            modelBuilder.ApplyConfiguration(new AvailabilityConfiguration());
            modelBuilder.ApplyConfiguration(new DocumentConfiguration());
            modelBuilder.ApplyConfiguration(new CouponConfiguration());
            modelBuilder.ApplyConfiguration(new NotificationConfiguration());

            // additional global index or conventions can go here
            // Prevent cascade deletes that could cause SQL Server "multiple cascade paths" errors.
            // Make all FKs that point to User or Professional use NoAction (no cascade).
            var userType = typeof(UrbanApi.Models.User);
            var profType = typeof(UrbanApi.Models.Professional);

            foreach (var fk in modelBuilder.Model.GetEntityTypes()
                         .SelectMany(t => t.GetForeignKeys()))
            {
                var principalClrType = fk.PrincipalEntityType.ClrType;
                if (principalClrType == userType || principalClrType == profType)
                {
                    fk.DeleteBehavior = DeleteBehavior.NoAction;
                }
            }

            base.OnModelCreating(modelBuilder);
        }
    }
}
