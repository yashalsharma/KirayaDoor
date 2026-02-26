using System.ComponentModel.DataAnnotations;

namespace KirayaDoor.Api.Data.Entities
{
    public class GovernmentIdType
    {
        [Key]
        public int GovernmentIdTypeId { get; set; }

        [Required]
        [MaxLength(50)]
        public string GovernmentIdTypeName { get; set; } = string.Empty;
    }
}
