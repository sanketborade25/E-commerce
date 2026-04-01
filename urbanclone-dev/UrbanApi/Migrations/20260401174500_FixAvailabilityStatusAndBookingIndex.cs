using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanApi.Migrations
{
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

            migrationBuilder.DropIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings",
                column: "AvailabilityId",
                unique: true,
                filter: "[AvailabilityId] IS NOT NULL AND [Status] <> 'REJECTED' AND [Status] <> 'CANCELLED'");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings",
                column: "AvailabilityId",
                unique: true,
                filter: "[AvailabilityId] IS NOT NULL AND [IsDeleted] = 0");
        }
    }
}
