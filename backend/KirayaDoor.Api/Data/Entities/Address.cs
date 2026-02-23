using System.ComponentModel.DataAnnotations;

namespace KirayaDoor.Api.Data.Entities
{
    public class Address
    {
        [Key]
        public int AddressId { get; set; }

        [Required]
        [MaxLength(500)]
        public string AddressText { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Location { get; set; }

        public virtual ICollection<Property>? Properties { get; set; }
    }
}
