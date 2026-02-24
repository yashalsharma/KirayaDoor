using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KirayaDoor.Api.Data.Entities
{
    public class Property
    {
        [Key]
        public int PropertyId { get; set; }

        [Required]
        [MaxLength(200)]
        public string PropertyName { get; set; } = string.Empty;

        [Required]
        public int OwnerId { get; set; }

        [Required]
        public int AddressId { get; set; }

        [ForeignKey("OwnerId")]
        public virtual User? Owner { get; set; }

        [ForeignKey("AddressId")]
        public virtual Address? Address { get; set; }

        public virtual ICollection<Unit>? Units { get; set; }
    }
}
