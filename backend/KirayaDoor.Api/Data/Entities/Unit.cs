using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class Unit
    {
        [Key]
        public int UnitId { get; set; }

        [Required]
        [MaxLength(100)]
        public string UnitName { get; set; } = string.Empty;

        [Required]
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property? Property { get; set; }

        public virtual ICollection<Tenant>? Tenants { get; set; }
    }
}
