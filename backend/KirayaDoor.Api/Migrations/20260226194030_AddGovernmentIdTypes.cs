using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace KirayaDoor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGovernmentIdTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GovernmentId",
                table: "Tenants",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GovernmentTypeId",
                table: "Tenants",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GovernmentIdTypes",
                columns: table => new
                {
                    GovernmentIdTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GovernmentIdTypeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GovernmentIdTypes", x => x.GovernmentIdTypeId);
                });

            migrationBuilder.InsertData(
                table: "GovernmentIdTypes",
                columns: new[] { "GovernmentIdTypeId", "GovernmentIdTypeName" },
                values: new object[,]
                {
                    { 1, "Aadhar" },
                    { 2, "Pancard" },
                    { 3, "DrivingLicense" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_GovernmentTypeId",
                table: "Tenants",
                column: "GovernmentTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_GovernmentIdTypes_GovernmentTypeId",
                table: "Tenants",
                column: "GovernmentTypeId",
                principalTable: "GovernmentIdTypes",
                principalColumn: "GovernmentIdTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_GovernmentIdTypes_GovernmentTypeId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "GovernmentIdTypes");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_GovernmentTypeId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "GovernmentId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "GovernmentTypeId",
                table: "Tenants");
        }
    }
}
