using System.ComponentModel.DataAnnotations;

namespace KirayaDoor.Api.Data.Entities
{
    public class ExpenseType
    {
        [Key]
        public int ExpenseTypeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ExpenseTypeName { get; set; } = string.Empty;
    }
}
