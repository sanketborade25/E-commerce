using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using UrbanApi.Data;

#nullable disable

namespace UrbanApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260401174500_FixAvailabilityStatusAndBookingIndex")]
    public partial class FixAvailabilityStatusAndBookingIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"UPDATE Availabilities
                  SET [Date] = CAST(StartAt AS date)
                  WHERE [Date] <> CAST(StartAt AS date)");

            migrationBuilder.Sql(
                @"UPDATE Availabilities
                  SET [Status] = CASE
                      WHEN EXISTS (
                          SELECT 1
                          FROM Bookings b
                          WHERE b.AvailabilityId = Availabilities.Id
                            AND b.Status <> 'REJECTED'
                            AND b.Status <> 'CANCELLED'
                      )
                      THEN 'booked'
                      ELSE 'available'
                  END");

            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Bookings_AvailabilityId'
                      AND object_id = OBJECT_ID('Bookings')
                )
                    DROP INDEX [IX_Bookings_AvailabilityId] ON [Bookings];

                CREATE UNIQUE INDEX [IX_Bookings_AvailabilityId]
                ON [Bookings] ([AvailabilityId])
                WHERE [AvailabilityId] IS NOT NULL AND [Status] <> 'REJECTED' AND [Status] <> 'CANCELLED';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Bookings_AvailabilityId'
                      AND object_id = OBJECT_ID('Bookings')
                )
                    DROP INDEX [IX_Bookings_AvailabilityId] ON [Bookings];

                CREATE UNIQUE INDEX [IX_Bookings_AvailabilityId]
                ON [Bookings] ([AvailabilityId])
                WHERE [AvailabilityId] IS NOT NULL AND [IsDeleted] = 0;
                """);
        }
    }
}
