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
        private readonly ITenantService _tenantService;
        private readonly ITenantStatementService _tenantStatementService;

        public PropertiesController(ApplicationDbContext context, ITenantService tenantService, ITenantStatementService tenantStatementService)
        {
            _context = context;
            _tenantService = tenantService;
            _tenantStatementService = tenantStatementService;
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
                    UnitCount = p.Units?.Count ?? 0,
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
                    UnitCount = property.Units?.Count ?? 0,
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

        // GET: api/tenants/{tenantId}/pending-amount
        [HttpGet("tenants/{tenantId}/pending-amount")]
        public async Task<ActionResult<PendingAmountDto>> GetTenantPendingAmount(int tenantId)
        {
            try
            {
                var pendingAmountService = HttpContext.RequestServices.GetRequiredService<PendingAmountService>();
                var pendingAmount = await pendingAmountService.CalculateTenantPendingAmountAsync(tenantId);
                return Ok(new PendingAmountDto { PendingAmount = pendingAmount });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/tenants/{tenantId}/details
        [HttpGet("tenants/{tenantId}/details")]
        public async Task<ActionResult<TenantDetailsDto>> GetTenantDetails(int tenantId)
        {
            try
            {
                var tenantDetails = await _tenantService.GetTenantDetailsAsync(tenantId);
                if (tenantDetails == null)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(tenantDetails);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/tenants/{tenantId}/details
        [HttpPut("tenants/{tenantId}/details")]
        public async Task<ActionResult<TenantDetailsDto>> UpdateTenantDetails(int tenantId, [FromBody] UpdateTenantDetailsRequest request)
        {
            try
            {
                var tenantDetails = await _tenantService.UpdateTenantDetailsAsync(tenantId, request);
                if (tenantDetails == null)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(tenantDetails);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/tenants/{tenantId}/statement/{year}/{month}
        [HttpGet("tenants/{tenantId}/statement/{year}/{month}")]
        public async Task<ActionResult<TenantStatementDto>> GetTenantStatement(int tenantId, int year, int month)
        {
            try
            {
                if (month < 1 || month > 12)
                    return BadRequest(new { error = "Month must be between 1 and 12" });

                var statement = await _tenantStatementService.GetMonthlyStatementAsync(tenantId, year, month);
                if (statement == null)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(statement);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/tenants/{tenantId}/expenses
        [HttpPost("tenants/{tenantId}/expenses")]
        public async Task<ActionResult<StatementLineItemDto>> AddTenantExpense(int tenantId, [FromBody] AddTenantExpenseRequest request)
        {
            try
            {
                var lineItem = await _tenantStatementService.AddTenantExpenseAsync(tenantId, request);
                if (lineItem == null)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(lineItem);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/tenants/{tenantId}/expenses
        [HttpGet("tenants/{tenantId}/expenses")]
        public async Task<ActionResult<List<TenantExpenseDto>>> GetTenantExpenses(int tenantId)
        {
            try
            {
                // Verify tenant exists first
                var tenant = await _context.Tenants.FindAsync(tenantId);
                if (tenant == null)
                    return NotFound(new { error = "Tenant not found" });

                var expenses = await _tenantStatementService.GetTenantActiveExpensesAsync(tenantId);
                return Ok(expenses ?? new List<TenantExpenseDto>());
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/tenants/{tenantId}/expenses/{expenseId}
        [HttpPut("tenants/{tenantId}/expenses/{expenseId}")]
        public async Task<ActionResult<StatementLineItemDto>> UpdateTenantExpense(int tenantId, int expenseId, [FromBody] UpdateTenantExpenseRequest request)
        {
            try
            {
                var lineItem = await _tenantStatementService.UpdateTenantExpenseAsync(tenantId, expenseId, request);
                if (lineItem == null)
                    return NotFound(new { error = "Expense not found" });

                return Ok(lineItem);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/tenants/{tenantId}/expenses/{expenseId}
        [HttpDelete("tenants/{tenantId}/expenses/{expenseId}")]
        public async Task<ActionResult> RetireTenantExpense(int tenantId, int expenseId)
        {
            try
            {
                var result = await _tenantStatementService.RetireTenantExpenseAsync(tenantId, expenseId);
                if (!result)
                    return NotFound(new { error = "Expense not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/tenants/{tenantId}/payments
        [HttpPost("tenants/{tenantId}/payments")]
        public async Task<ActionResult<StatementLineItemDto>> RecordPayment(int tenantId, [FromBody] RecordPaymentRequest request)
        {
            try
            {
                var lineItem = await _tenantStatementService.RecordPaymentAsync(tenantId, request);
                if (lineItem == null)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(lineItem);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/tenants/{tenantId}
        [HttpDelete("tenants/{tenantId}")]
        public async Task<ActionResult> DeleteTenant(int tenantId)
        {
            try
            {
                var success = await _tenantStatementService.DeleteTenantAsync(tenantId);
                if (!success)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(new { message = "Tenant deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/tenants/{tenantId}/mark-inactive
        [HttpPut("tenants/{tenantId}/mark-inactive")]
        public async Task<ActionResult> MarkTenantAsInactive(int tenantId)
        {
            try
            {
                var success = await _tenantStatementService.MarkTenantAsInactiveAsync(tenantId);
                if (!success)
                    return NotFound(new { error = "Tenant not found" });

                return Ok(new { message = "Tenant marked as inactive" });
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
                        GovernmentId = t.GovernmentId,
                        GovernmentTypeId = t.GovernmentTypeId,
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

        // POST: api/properties/{propertyId}/units
        [HttpPost("{propertyId}/units")]
        public async Task<ActionResult<UnitDto>> CreateUnit(int propertyId, [FromBody] CreateUnitRequest request)
        {
            try
            {
                // Verify property exists
                var property = await _context.Properties.FindAsync(propertyId);
                if (property == null)
                {
                    return NotFound(new { error = "Property not found" });
                }

                if (string.IsNullOrWhiteSpace(request.UnitName))
                {
                    return BadRequest(new { error = "Unit name is required" });
                }

                // Create the unit
                var unit = new Unit
                {
                    UnitName = request.UnitName,
                    PropertyId = propertyId
                };

                _context.Units.Add(unit);
                await _context.SaveChangesAsync();

                var unitDto = new UnitDto
                {
                    UnitId = unit.UnitId,
                    UnitName = unit.UnitName,
                    PropertyId = unit.PropertyId,
                    Tenants = new List<TenantDto>()
                };

                return CreatedAtAction(nameof(GetUnitsWithTenants), new { id = propertyId }, unitDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/properties/units/{unitId}
        [HttpPut("units/{unitId}")]
        public async Task<IActionResult> UpdateUnit(int unitId, [FromBody] CreateUnitRequest request)
        {
            try
            {
                var unit = await _context.Units.FindAsync(unitId);
                if (unit == null)
                {
                    return NotFound(new { error = "Unit not found" });
                }

                if (string.IsNullOrWhiteSpace(request.UnitName))
                {
                    return BadRequest(new { error = "Unit name is required" });
                }

                unit.UnitName = request.UnitName;
                _context.Units.Update(unit);
                await _context.SaveChangesAsync();

                return Ok(new UnitDto
                {
                    UnitId = unit.UnitId,
                    UnitName = unit.UnitName,
                    PropertyId = unit.PropertyId,
                    Tenants = new List<TenantDto>()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/properties/units/{unitId}
        [HttpDelete("units/{unitId}")]
#pragma warning disable CS8620
        public async Task<IActionResult> DeleteUnit(int unitId)
        {
            try
            {
                var unit = await _context.Units
                    .Include(u => u.Tenants)
                    .ThenInclude(t => t!.TenantExpenses)
                    .Include(u => u.Tenants)
                    .ThenInclude(t => t!.PaidExpenses)
                    .FirstOrDefaultAsync(u => u.UnitId == unitId);

                if (unit == null)
                {
                    return NotFound(new { error = "Unit not found" });
                }

                // Delete all related data in cascade order
                if (unit.Tenants != null && unit.Tenants.Any())
                {
                    foreach (var tenant in unit.Tenants)
                    {
                        // Delete all paid expenses for this tenant
                        // (includes both those linked to TenantExpenses and manual payments)
                        if (tenant.PaidExpenses != null && tenant.PaidExpenses.Any())
                        {
                            _context.PaidExpenses.RemoveRange(tenant.PaidExpenses);
                        }

                        // Delete all tenant expenses for this tenant
                        if (tenant.TenantExpenses != null && tenant.TenantExpenses.Any())
                        {
                            _context.TenantExpenses.RemoveRange(tenant.TenantExpenses);
                        }
                    }

                    // Delete all tenants in this unit
                    _context.Tenants.RemoveRange(unit.Tenants);
                }

                // Delete the unit itself
                _context.Units.Remove(unit);

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
#pragma warning restore CS8620

        // POST: api/properties/units/{unitId}/tenants
        [HttpPost("units/{unitId}/tenants")]
        public async Task<ActionResult<TenantDto>> CreateTenant(int unitId, [FromBody] CreateTenantRequest request)
        {
            try
            {
                // Verify unit exists
                var unit = await _context.Units.FindAsync(unitId);
                if (unit == null)
                {
                    return NotFound(new { error = "Unit not found" });
                }

                if (string.IsNullOrWhiteSpace(request.TenantName))
                {
                    return BadRequest(new { error = "Tenant name is required" });
                }

                if (string.IsNullOrWhiteSpace(request.TenantContactNumber))
                {
                    return BadRequest(new { error = "Tenant contact number is required" });
                }

                var tenant = new Tenant
                {
                    UnitId = unitId,
                    TenantName = request.TenantName.Trim(),
                    TenantContactNumber = request.TenantContactNumber.Trim(),
                    GovernmentId = request.GovernmentId,
                    GovernmentTypeId = request.GovernmentTypeId,
                    IsActive = true // Always create as active
                };

                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                var tenantDto = new TenantDto
                {
                    TenantId = tenant.TenantId,
                    TenantName = tenant.TenantName,
                    TenantContactNumber = tenant.TenantContactNumber,
                    GovernmentId = tenant.GovernmentId,
                    GovernmentTypeId = tenant.GovernmentTypeId,
                    IsActive = tenant.IsActive
                };

                return CreatedAtAction(nameof(CreateTenant), new { unitId = unitId, tenantId = tenant.TenantId }, tenantDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/properties/{propertyId}/tenants/{tenantId}
        [HttpDelete("{propertyId}/tenants/{tenantId}")]
#pragma warning disable CS8620
        public async Task<IActionResult> DeleteTenant(int propertyId, int tenantId)
        {
            try
            {
                // Step 1: Delete all paid expenses against this tenant (regardless of TenantExpense link)
                var allPaidExpenses = await _context.PaidExpenses
                    .Where(pe => pe.TenantId == tenantId)
                    .ToListAsync();
                
                if (allPaidExpenses.Any())
                {
                    _context.PaidExpenses.RemoveRange(allPaidExpenses);
                    await _context.SaveChangesAsync();
                }

                // Step 2: Delete all tenant expenses for this tenant
                var allTenantExpenses = await _context.TenantExpenses
                    .Where(te => te.TenantId == tenantId)
                    .ToListAsync();
                
                if (allTenantExpenses.Any())
                {
                    _context.TenantExpenses.RemoveRange(allTenantExpenses);
                    await _context.SaveChangesAsync();
                }

                // Step 3: Delete the tenant itself
                var tenant = await _context.Tenants.FindAsync(tenantId);
                if (tenant != null)
                {
                    _context.Tenants.Remove(tenant);
                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
#pragma warning restore CS8620

        // GET: api/properties/expense-types
        [HttpGet("expense-types")]
        public async Task<ActionResult<IEnumerable<ExpenseTypeDto>>> GetExpenseTypes()
        {
            try
            {
                var expenseTypes = await _context.ExpenseTypes
                    .AsNoTracking()
                    .ToListAsync();

                var expenseTypeDtos = expenseTypes.Select(et => new ExpenseTypeDto
                {
                    ExpenseTypeId = et.ExpenseTypeId,
                    ExpenseTypeName = et.ExpenseTypeName
                }).ToList();

                return Ok(expenseTypeDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/properties/expense-cycles
        [HttpGet("expense-cycles")]
        public async Task<ActionResult<IEnumerable<ExpenseCycleDto>>> GetExpenseCycles()
        {
            try
            {
                var expenseCycles = await _context.ExpenseCycles
                    .AsNoTracking()
                    .ToListAsync();

                var expenseCycleDtos = expenseCycles.Select(ec => new ExpenseCycleDto
                {
                    ExpenseCycleId = ec.ExpenseCycleId,
                    ExpenseCycleName = ec.ExpenseCycleName
                }).ToList();

                return Ok(expenseCycleDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/properties/government-id-types
        [HttpGet("government-id-types")]
        public async Task<ActionResult<IEnumerable<GovernmentIdTypeDto>>> GetGovernmentIdTypes()
        {
            try
            {
                var governmentIdTypes = await _context.GovernmentIdTypes
                    .AsNoTracking()
                    .ToListAsync();

                var governmentIdTypeDtos = governmentIdTypes.Select(git => new GovernmentIdTypeDto
                {
                    GovernmentIdTypeId = git.GovernmentIdTypeId,
                    GovernmentIdTypeName = git.GovernmentIdTypeName
                }).ToList();

                return Ok(governmentIdTypeDtos);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
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
                    UnitCount = request.UnitCount,
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

    public class CreateUnitRequest
    {
        public string UnitName { get; set; } = string.Empty;
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
        public string? GovernmentId { get; set; }
        public int? GovernmentTypeId { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateTenantRequest
    {
        public string TenantName { get; set; } = string.Empty;
        public string TenantContactNumber { get; set; } = string.Empty;
        public string? GovernmentId { get; set; }
        public int? GovernmentTypeId { get; set; }
    }

    public class CreateTenantExpenseRequest
    {
        public int TenantExpenseTypeId { get; set; }
        public int TenantExpenseCycleId { get; set; }
        public required string TenantExpenseStartDate { get; set; } // ISO date string YYYY-MM-DD
        public string? TenantExpenseEndDate { get; set; } // ISO date string YYYY-MM-DD
        public decimal TenantExpenseAmount { get; set; }
        public string? Comments { get; set; }
    }

    public class ExpenseTypeDto
    {
        public int ExpenseTypeId { get; set; }
        public string ExpenseTypeName { get; set; } = string.Empty;
    }

    public class ExpenseCycleDto
    {
        public int ExpenseCycleId { get; set; }
        public string ExpenseCycleName { get; set; } = string.Empty;
    }

    public class GovernmentIdTypeDto
    {
        public int GovernmentIdTypeId { get; set; }
        public string GovernmentIdTypeName { get; set; } = string.Empty;
    }

    public class PendingAmountDto
    {
        public decimal PendingAmount { get; set; }
    }
}
