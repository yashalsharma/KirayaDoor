using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class Tenant
    {
        [Key]
        public int TenantId { get; set; }

        [Required]
        public int UnitId { get; set; }

        [Required]
        [MaxLength(100)]
        public string TenantName { get; set; } = string.Empty;

        [Required]
        [MaxLength(15)]
        public string TenantContactNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? GovernmentId { get; set; }

        public int? GovernmentTypeId { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [ForeignKey("UnitId")]
        public virtual Unit? Unit { get; set; }

        [ForeignKey("GovernmentTypeId")]
        public virtual GovernmentIdType? GovernmentIdType { get; set; }

        public virtual ICollection<TenantExpense>? TenantExpenses { get; set; }
        public virtual ICollection<PaidExpense>? PaidExpenses { get; set; }
    }
}
