using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class TenantExpense
    {
        [Key]
        public int TenantExpenseId { get; set; }

        [Required]
        public int TenantId { get; set; }

        [Required]
        public int TenantExpenseTypeId { get; set; }

        [Required]
        public int TenantExpenseCycleId { get; set; }

        [Required]
        public DateTime TenantExpenseStartDate { get; set; }

        [Required]
        public decimal TenantExpenseAmount { get; set; }

        [MaxLength(500)]
        public string? Comments { get; set; }

        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("TenantExpenseTypeId")]
        public virtual ExpenseType? ExpenseType { get; set; }

        [ForeignKey("TenantExpenseCycleId")]
        public virtual ExpenseCycle? ExpenseCycle { get; set; }
    }
}
