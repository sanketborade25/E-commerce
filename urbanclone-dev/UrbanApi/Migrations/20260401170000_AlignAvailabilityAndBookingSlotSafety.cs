using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanApi.Migrations
{
    public partial class AlignAvailabilityAndBookingSlotSafety : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvailabilityId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Date",
                table: "Availabilities",
                type: "date",
                nullable: false,
                defaultValueSql: "CAST(SYSUTCDATETIME() AS date)");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Availabilities",
                type: "nvarchar(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "available");

            migrationBuilder.Sql(
                @"UPDATE Availabilities
                  SET [Date] = CAST(StartAt AS date),
                      [Status] = CASE WHEN IsDeleted = 1 THEN 'booked' ELSE 'available' END");

            migrationBuilder.CreateIndex(
                name: "IX_Availabilities_ProfessionalId_Date_Status",
                table: "Availabilities",
                columns: new[] { "ProfessionalId", "Date", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings",
                column: "AvailabilityId",
                unique: true,
                filter: "[AvailabilityId] IS NOT NULL AND [IsDeleted] = 0");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Availabilities_ProfessionalId_Date_Status",
                table: "Availabilities");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_AvailabilityId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "AvailabilityId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "Availabilities");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Availabilities");
        }
    }
}
