using Microsoft.EntityFrameworkCore;
using KirayaDoor.Api.Data;
using KirayaDoor.Api.Data.Entities;
using KirayaDoor.Api.Controllers;

namespace KirayaDoor.Api.Services
{
    public interface ITenantService
    {
        Task<TenantDetailsDto?> GetTenantDetailsAsync(int tenantId);
        Task<TenantDetailsDto?> UpdateTenantDetailsAsync(int tenantId, UpdateTenantDetailsRequest request);
    }

    public class TenantService : ITenantService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TenantService> _logger;

        public TenantService(ApplicationDbContext context, ILogger<TenantService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TenantDetailsDto?> GetTenantDetailsAsync(int tenantId)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.TenantId == tenantId)
                    .Include(t => t.GovernmentIdType)
                    .FirstOrDefaultAsync();

                if (tenant == null)
                {
                    _logger.LogWarning($"Tenant not found: {tenantId}");
                    return null;
                }

                return MapToDetailsDto(tenant);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting tenant details: {ex.Message}");
                throw;
            }
        }

        public async Task<TenantDetailsDto?> UpdateTenantDetailsAsync(int tenantId, UpdateTenantDetailsRequest request)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.TenantId == tenantId && t.IsActive)
                    .FirstOrDefaultAsync();

                if (tenant == null)
                {
                    _logger.LogWarning($"Tenant not found for update: {tenantId}");
                    return null;
                }

                // Validate input
                if (string.IsNullOrWhiteSpace(request.TenantName))
                    throw new ArgumentException("Tenant name is required");

                if (string.IsNullOrWhiteSpace(request.TenantContactNumber) || 
                    !System.Text.RegularExpressions.Regex.IsMatch(request.TenantContactNumber, @"^\d{10}$"))
                    throw new ArgumentException("Valid 10-digit contact number is required");

                // Update tenant details
                tenant.TenantName = request.TenantName.Trim();
                tenant.TenantContactNumber = request.TenantContactNumber.Trim();
                tenant.GovernmentId = request.GovernmentId?.Trim();
                tenant.GovernmentTypeId = request.GovernmentTypeId;

                await _context.SaveChangesAsync();

                // Reload with related data
                await _context.Entry(tenant).Reference(t => t.GovernmentIdType).LoadAsync();

                _logger.LogInformation($"Tenant details updated: {tenantId}");

                return MapToDetailsDto(tenant);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating tenant details: {ex.Message}");
                throw;
            }
        }

        private TenantDetailsDto MapToDetailsDto(Tenant tenant)
        {
            return new TenantDetailsDto
            {
                TenantId = tenant.TenantId,
                UnitId = tenant.UnitId,
                TenantName = tenant.TenantName,
                TenantContactNumber = tenant.TenantContactNumber,
                GovernmentId = tenant.GovernmentId,
                GovernmentTypeId = tenant.GovernmentTypeId,
                GovernmentTypeName = tenant.GovernmentIdType?.GovernmentIdTypeName,
                IsActive = tenant.IsActive
            };
        }
    }
}
