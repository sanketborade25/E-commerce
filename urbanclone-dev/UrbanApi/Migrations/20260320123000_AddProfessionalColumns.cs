using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UrbanApi.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionalColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Earnings",
                table: "Professionals",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnline",
                table: "Professionals",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "Professionals",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "Professionals",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Earnings",
                table: "Professionals");

            migrationBuilder.DropColumn(
                name: "IsOnline",
                table: "Professionals");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Professionals");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Professionals");
        }
    }
}
