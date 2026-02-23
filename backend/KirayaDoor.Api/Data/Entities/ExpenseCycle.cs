using System.ComponentModel.DataAnnotations;

namespace KirayaDoor.Api.Data.Entities
{
    public class ExpenseCycle
    {
        [Key]
        public int ExpenseCycleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string ExpenseCycleName { get; set; } = string.Empty;
    }
}
