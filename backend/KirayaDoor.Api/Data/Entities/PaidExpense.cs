using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class PaidExpense
    {
        [Key]
        public int PaidExpenseId { get; set; }

        [Required]
        public int TenantId { get; set; }

        [Required]
        public int ExpenseTypeId { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        [Required]
        public decimal PaymentAmount { get; set; }

        [MaxLength(500)]
        public string? Comments { get; set; }

        [ForeignKey("TenantId")]
        public virtual Tenant? Tenant { get; set; }

        [ForeignKey("ExpenseTypeId")]
        public virtual ExpenseType? ExpenseType { get; set; }
    }
}
