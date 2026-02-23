using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KirayaDoor.Api.Data;
using KirayaDoor.Api.Data.Entities;
using KirayaDoor.Api.Services;

namespace KirayaDoor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PropertiesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/properties/owner/{userId}
        [HttpGet("owner/{userId}")]
        public async Task<ActionResult<IEnumerable<PropertyDto>>> GetPropertiesByOwner(int userId)
        {
            try
            {
                var properties = await _context.Properties
                    .Where(p => p.OwnerId == userId)
                    .Include(p => p.Address)
                    .Include(p => p.Units)
                    .ToListAsync();

                var propertyDtos = properties.Select(p => new PropertyDto
                {
                    PropertyId = p.PropertyId,
                    PropertyName = p.PropertyName,
                    UnitCount = p.UnitCount,
                    OwnerId = p.OwnerId,
                    Address = p.Address != null ? new AddressDto
                    {
                        AddressId = p.Address.AddressId,
                        AddressText = p.Address.AddressText,
                        Location = p.Address.Location
                    } : null
                }).ToList();

                return Ok(propertyDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/properties/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PropertyDto>> GetProperty(int id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Address)
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.PropertyId == id);

                if (property == null)
                {
                    return NotFound(new { error = "Property not found" });
                }

                var propertyDto = new PropertyDto
                {
                    PropertyId = property.PropertyId,
                    PropertyName = property.PropertyName,
                    UnitCount = property.UnitCount,
                    OwnerId = property.OwnerId,
                    Address = property.Address != null ? new AddressDto
                    {
                        AddressId = property.Address.AddressId,
                        AddressText = property.Address.AddressText,
                        Location = property.Address.Location
                    } : null
                };

                return Ok(propertyDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/properties/{id}/pending-amount
        [HttpGet("{id}/pending-amount")]
        public async Task<ActionResult<PendingAmountDto>> GetPropertyPendingAmount(int id)
        {
            try
            {
                var pendingAmountService = HttpContext.RequestServices.GetRequiredService<PendingAmountService>();
                var pendingAmount = await pendingAmountService.CalculatePropertyPendingAmountAsync(id);
                return Ok(new PendingAmountDto { PendingAmount = pendingAmount });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/properties/{id}/units
        [HttpGet("{id}/units")]
        public async Task<ActionResult<IEnumerable<UnitDto>>> GetUnitsWithTenants(int id)
        {
            try
            {
                // Load property with units
                var property = await _context.Properties
                    .Include(p => p.Units)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.PropertyId == id);

                if (property == null)
                {
                    return NotFound(new { error = "Property not found" });
                }

                // Load tenants for all units
                var unitIds = property.Units?.Select(u => u.UnitId).ToList() ?? new List<int>();
                var unitsWithTenants = await _context.Units
                    .Where(u => unitIds.Contains(u.UnitId))
                    .Include(u => u.Tenants)
                    .AsNoTracking()
                    .ToListAsync();

                var unitDtos = unitsWithTenants.Select(u => new UnitDto
                {
                    UnitId = u.UnitId,
                    UnitName = u.UnitName,
                    PropertyId = u.PropertyId,
                    Tenants = u.Tenants?.Select(t => new TenantDto
                    {
                        TenantId = t.TenantId,
                        TenantName = t.TenantName,
                        TenantContactNumber = t.TenantContactNumber,
                        IsActive = t.IsActive
                    }).ToList() ?? new List<TenantDto>()
                }).ToList() ?? new List<UnitDto>();

                return Ok(unitDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/properties
        [HttpPost]
        public async Task<ActionResult<PropertyDto>> CreateProperty([FromBody] CreatePropertyRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.PropertyName))
                {
                    return BadRequest(new { error = "Property name is required" });
                }

                if (request.UnitCount < 1)
                {
                    return BadRequest(new { error = "Unit count must be at least 1" });
                }

                if (string.IsNullOrWhiteSpace(request.AddressText) && string.IsNullOrWhiteSpace(request.Location))
                {
                    return BadRequest(new { error = "Address or location is required" });
                }

                // Create or find address
                Address? address = null;
                if (!string.IsNullOrWhiteSpace(request.AddressText) || !string.IsNullOrWhiteSpace(request.Location))
                {
                    address = new Address
                    {
                        AddressText = request.AddressText ?? string.Empty,
                        Location = request.Location
                    };
                    _context.Addresses.Add(address);
                    await _context.SaveChangesAsync();
                }

                // Create property
                var property = new Property
                {
                    PropertyName = request.PropertyName,
                    UnitCount = request.UnitCount,
                    OwnerId = request.OwnerId,
                    AddressId = address?.AddressId ?? 0
                };

                _context.Properties.Add(property);
                await _context.SaveChangesAsync();

                // Create default units
                var units = new List<Unit>();
                for (int i = 1; i <= request.UnitCount; i++)
                {
                    units.Add(new Unit
                    {
                        UnitName = $"Unit {i}",
                        PropertyId = property.PropertyId
                    });
                }

                _context.Units.AddRange(units);
                await _context.SaveChangesAsync();

                var propertyDto = new PropertyDto
                {
                    PropertyId = property.PropertyId,
                    PropertyName = property.PropertyName,
                    UnitCount = property.UnitCount,
                    OwnerId = property.OwnerId,
                    Address = address != null ? new AddressDto
                    {
                        AddressId = address.AddressId,
                        AddressText = address.AddressText,
                        Location = address.Location
                    } : null
                };

                return CreatedAtAction(nameof(GetProperty), new { id = property.PropertyId }, propertyDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/properties/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyRequest request)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Address)
                    .FirstOrDefaultAsync(p => p.PropertyId == id);

                if (property == null)
                {
                    return NotFound(new { error = "Property not found" });
                }

                if (!string.IsNullOrWhiteSpace(request.PropertyName))
                {
                    property.PropertyName = request.PropertyName;
                }

                // Handle address update
                if (!string.IsNullOrWhiteSpace(request.AddressText) || !string.IsNullOrWhiteSpace(request.Location))
                {
                    if (property.Address == null)
                    {
                        // Create new address
                        var newAddress = new Address
                        {
                            AddressText = request.AddressText ?? string.Empty,
                            Location = request.Location
                        };
                        _context.Addresses.Add(newAddress);
                        await _context.SaveChangesAsync();
                        property.AddressId = newAddress.AddressId;
                    }else
                    {
                        // Update existing address
                        if (!string.IsNullOrWhiteSpace(request.AddressText))
                        {
                            property.Address.AddressText = request.AddressText;
                        }

                        if (!string.IsNullOrWhiteSpace(request.Location))
                        {
                            property.Address.Location = request.Location;
                        }

                        _context.Addresses.Update(property.Address);
                    }
                }

                _context.Properties.Update(property);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/properties/{id}
        [HttpDelete("{id}")]
#pragma warning disable CS8620
        public async Task<IActionResult> DeleteProperty(int id)
        {
            try
            {
                var property = await _context.Properties
                    .Include(p => p.Units).ThenInclude(u => u!.Tenants)
                    .ThenInclude(t => t!.TenantExpenses)
                    .Include(p => p.Units).ThenInclude(u => u!.Tenants)
                    .ThenInclude(t => t!.PaidExpenses)
                    .FirstOrDefaultAsync(p => p.PropertyId == id);

                if (property == null)
                {
                    return NotFound(new { error = "Property not found" });
                }

                // Delete all related data
                foreach (var unit in property.Units ?? new List<Unit>())
                {
                    foreach (var tenant in unit.Tenants ?? new List<Tenant>())
                    {
                        // Delete tenant expenses
                        if (tenant.TenantExpenses != null)
                        {
                            _context.TenantExpenses.RemoveRange(tenant.TenantExpenses);
                        }

                        // Delete paid expenses
                        if (tenant.PaidExpenses != null)
                        {
                            _context.PaidExpenses.RemoveRange(tenant.PaidExpenses);
                        }
                    }

                    // Delete tenants
                    _context.Tenants.RemoveRange(unit.Tenants ?? new List<Tenant>());
                }

                // Delete units
                _context.Units.RemoveRange(property.Units ?? new List<Unit>());

                // Delete property
                _context.Properties.Remove(property);

                // Delete address if it exists
                if (property.AddressId > 0)
                {
                    var address = await _context.Addresses.FindAsync(property.AddressId);
                    if (address != null)
                    {
                        _context.Addresses.Remove(address);
                    }
                }

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
#pragma warning restore CS8620
    }

    // DTOs
    public class PropertyDto
    {
        public int PropertyId { get; set; }
        public required string PropertyName { get; set; }
        public int UnitCount { get; set; }
        public int OwnerId { get; set; }
        public AddressDto? Address { get; set; }
    }

    public class AddressDto
    {
        public int AddressId { get; set; }
        public string? AddressText { get; set; }
        public string? Location { get; set; }
    }

    public class CreatePropertyRequest
    {
        public int OwnerId { get; set; }
        public string? PropertyName { get; set; }
        public int UnitCount { get; set; }
        public string? AddressText { get; set; }
        public string? Location { get; set; }
    }

    public class UpdatePropertyRequest
    {
        public string? PropertyName { get; set; }
        public string? AddressText { get; set; }
        public string? Location { get; set; }
    }

    public class UnitDto
    {
        public int UnitId { get; set; }
        public string UnitName { get; set; } = string.Empty;
        public int PropertyId { get; set; }
        public List<TenantDto> Tenants { get; set; } = new List<TenantDto>();
    }

    public class TenantDto
    {
        public int TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public string TenantContactNumber { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class PendingAmountDto
    {
        public decimal PendingAmount { get; set; }
    }
}
