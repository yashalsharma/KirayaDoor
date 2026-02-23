using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [MaxLength(15)]
        public required string MobileNumber { get; set; }

        [MaxLength(100)]
        public string? EmailAddress { get; set; }

        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        public int UserTypeId { get; set; } = 0;

        [Required]
        [MaxLength(2)]
        public string PreferredLanguage { get; set; } = "en";

        [ForeignKey("UserTypeId")]
        public virtual UserType? UserType { get; set; }
    }
}
