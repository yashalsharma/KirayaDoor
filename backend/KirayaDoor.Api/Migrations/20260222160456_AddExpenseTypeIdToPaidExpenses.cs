using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KirayaDoor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseTypeIdToPaidExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpenseTypeId",
                table: "PaidExpenses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PaidExpenses_ExpenseTypeId",
                table: "PaidExpenses",
                column: "ExpenseTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_PaidExpenses_ExpenseTypes_ExpenseTypeId",
                table: "PaidExpenses",
                column: "ExpenseTypeId",
                principalTable: "ExpenseTypes",
                principalColumn: "ExpenseTypeId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PaidExpenses_ExpenseTypes_ExpenseTypeId",
                table: "PaidExpenses");

            migrationBuilder.DropIndex(
                name: "IX_PaidExpenses_ExpenseTypeId",
                table: "PaidExpenses");

            migrationBuilder.DropColumn(
                name: "ExpenseTypeId",
                table: "PaidExpenses");
        }
    }
}
