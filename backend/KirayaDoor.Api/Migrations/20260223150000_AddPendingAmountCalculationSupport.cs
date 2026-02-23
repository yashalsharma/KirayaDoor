using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KirayaDoor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingAmountCalculationSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add TenantExpenseEndDate column to TenantExpenses table
            migrationBuilder.AddColumn<DateTime>(
                name: "TenantExpenseEndDate",
                table: "TenantExpenses",
                type: "datetime2",
                nullable: true,
                comment: "When the expense ends (e.g., tenant moves out) - null means ongoing");

            // Add TenantExpenseId column to PaidExpenses table (FK)
            migrationBuilder.AddColumn<int>(
                name: "TenantExpenseId",
                table: "PaidExpenses",
                type: "int",
                nullable: true,
                comment: "Link to specific tenant expense - optional for manual payments");

            // Create foreign key constraint
            migrationBuilder.CreateIndex(
                name: "IX_PaidExpenses_TenantExpenseId",
                table: "PaidExpenses",
                column: "TenantExpenseId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaidExpenses_TenantExpenses_TenantExpenseId",
                table: "PaidExpenses",
                column: "TenantExpenseId",
                principalTable: "TenantExpenses",
                principalColumn: "TenantExpenseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key
            migrationBuilder.DropForeignKey(
                name: "FK_PaidExpenses_TenantExpenses_TenantExpenseId",
                table: "PaidExpenses");

            // Drop index
            migrationBuilder.DropIndex(
                name: "IX_PaidExpenses_TenantExpenseId",
                table: "PaidExpenses");

            // Remove columns
            migrationBuilder.DropColumn(
                name: "TenantExpenseEndDate",
                table: "TenantExpenses");

            migrationBuilder.DropColumn(
                name: "TenantExpenseId",
                table: "PaidExpenses");
        }
    }
}
