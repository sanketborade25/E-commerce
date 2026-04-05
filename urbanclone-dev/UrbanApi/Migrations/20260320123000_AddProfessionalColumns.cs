using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using UrbanApi.Data;

#nullable disable

namespace UrbanApi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260320123000_AddProfessionalColumns")]
    /// <inheritdoc />
    public partial class AddProfessionalColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Professionals', 'Earnings') IS NULL
                    ALTER TABLE [Professionals] ADD [Earnings] decimal(18,2) NOT NULL CONSTRAINT [DF_Professionals_Earnings] DEFAULT (0);

                IF COL_LENGTH('Professionals', 'IsOnline') IS NULL
                    ALTER TABLE [Professionals] ADD [IsOnline] bit NOT NULL CONSTRAINT [DF_Professionals_IsOnline] DEFAULT (0);

                IF COL_LENGTH('Professionals', 'Latitude') IS NULL
                    ALTER TABLE [Professionals] ADD [Latitude] decimal(18,2) NULL;

                IF COL_LENGTH('Professionals', 'Longitude') IS NULL
                    ALTER TABLE [Professionals] ADD [Longitude] decimal(18,2) NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('Professionals', 'Earnings') IS NOT NULL
                BEGIN
                    IF OBJECT_ID('DF_Professionals_Earnings', 'D') IS NOT NULL
                        ALTER TABLE [Professionals] DROP CONSTRAINT [DF_Professionals_Earnings];
                    ALTER TABLE [Professionals] DROP COLUMN [Earnings];
                END

                IF COL_LENGTH('Professionals', 'IsOnline') IS NOT NULL
                BEGIN
                    IF OBJECT_ID('DF_Professionals_IsOnline', 'D') IS NOT NULL
                        ALTER TABLE [Professionals] DROP CONSTRAINT [DF_Professionals_IsOnline];
                    ALTER TABLE [Professionals] DROP COLUMN [IsOnline];
                END

                IF COL_LENGTH('Professionals', 'Latitude') IS NOT NULL
                    ALTER TABLE [Professionals] DROP COLUMN [Latitude];

                IF COL_LENGTH('Professionals', 'Longitude') IS NOT NULL
                    ALTER TABLE [Professionals] DROP COLUMN [Longitude];
                """);
        }
    }
}
