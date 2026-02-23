using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KirayaDoor.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingAmountCalculationSupport2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "TenantExpenseEndDate",
                table: "TenantExpenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TenantExpenseId",
                table: "PaidExpenses",
                type: "int",
                nullable: true);

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
            migrationBuilder.DropForeignKey(
                name: "FK_PaidExpenses_TenantExpenses_TenantExpenseId",
                table: "PaidExpenses");

            migrationBuilder.DropIndex(
                name: "IX_PaidExpenses_TenantExpenseId",
                table: "PaidExpenses");

            migrationBuilder.DropColumn(
                name: "TenantExpenseEndDate",
                table: "TenantExpenses");

            migrationBuilder.DropColumn(
                name: "TenantExpenseId",
                table: "PaidExpenses");
        }
    }
}
