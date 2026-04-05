using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using UrbanApi.Data;

#nullable disable

namespace UrbanApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260401170000_AlignAvailabilityAndBookingSlotSafety")]
    public partial class AlignAvailabilityAndBookingSlotSafety : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Bookings', 'AvailabilityId') IS NULL
                    ALTER TABLE [Bookings] ADD [AvailabilityId] int NULL;

                IF COL_LENGTH('Availabilities', 'Date') IS NULL
                    ALTER TABLE [Availabilities] ADD [Date] date NOT NULL CONSTRAINT [DF_Availabilities_Date] DEFAULT (CAST(SYSUTCDATETIME() AS date));

                IF COL_LENGTH('Availabilities', 'Status') IS NULL
                    ALTER TABLE [Availabilities] ADD [Status] nvarchar(24) NOT NULL CONSTRAINT [DF_Availabilities_Status] DEFAULT ('available');
                """);

            migrationBuilder.Sql(
                @"UPDATE Availabilities
                  SET [Date] = CAST(StartAt AS date),
                      [Status] = CASE
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
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Availabilities_ProfessionalId_Date_Status'
                      AND object_id = OBJECT_ID('Availabilities')
                )
                    CREATE INDEX [IX_Availabilities_ProfessionalId_Date_Status]
                    ON [Availabilities] ([ProfessionalId], [Date], [Status]);

                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Bookings_AvailabilityId'
                      AND object_id = OBJECT_ID('Bookings')
                )
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
                    WHERE name = 'IX_Availabilities_ProfessionalId_Date_Status'
                      AND object_id = OBJECT_ID('Availabilities')
                )
                    DROP INDEX [IX_Availabilities_ProfessionalId_Date_Status] ON [Availabilities];

                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_Bookings_AvailabilityId'
                      AND object_id = OBJECT_ID('Bookings')
                )
                    DROP INDEX [IX_Bookings_AvailabilityId] ON [Bookings];

                IF COL_LENGTH('Bookings', 'AvailabilityId') IS NOT NULL
                    ALTER TABLE [Bookings] DROP COLUMN [AvailabilityId];

                IF COL_LENGTH('Availabilities', 'Date') IS NOT NULL
                BEGIN
                    IF OBJECT_ID('DF_Availabilities_Date', 'D') IS NOT NULL
                        ALTER TABLE [Availabilities] DROP CONSTRAINT [DF_Availabilities_Date];
                    ALTER TABLE [Availabilities] DROP COLUMN [Date];
                END

                IF COL_LENGTH('Availabilities', 'Status') IS NOT NULL
                BEGIN
                    IF OBJECT_ID('DF_Availabilities_Status', 'D') IS NOT NULL
                        ALTER TABLE [Availabilities] DROP CONSTRAINT [DF_Availabilities_Status];
                    ALTER TABLE [Availabilities] DROP COLUMN [Status];
                END
                """);
        }
    }
}
