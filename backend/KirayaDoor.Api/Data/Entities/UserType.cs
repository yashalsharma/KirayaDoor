using System.ComponentModel.DataAnnotations;

namespace KirayaDoor.Api.Data.Entities
{
    public class UserType
    {
        [Key]
        public int UserTypeId { get; set; }

        [Required]
        [MaxLength(50)]
        public required string TypeName { get; set; }
    }
}
