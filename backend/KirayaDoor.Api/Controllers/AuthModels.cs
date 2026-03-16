using System.Text.Json.Serialization;

namespace KirayaDoor.Api.Controllers
{
    public class SendOtpRequest
    {
        public required string MobileNumber { get; set; }
        public string? EmailAddress { get; set; }
    }

    public class VerifyOtpRequest
    {
        public required string MobileNumber { get; set; }
        public required string Otp { get; set; }
    }

    public class UpdateUserPreferencesRequest
    {
        public int UserId { get; set; }
        public int UserTypeId { get; set; }
        public string? UserName { get; set; }
        public string? EmailAddress { get; set; }
        public string PreferredLanguage { get; set; } = "en";
    }

    // Tenant Management DTOs
    public class TenantDetailsDto
    {
        public int TenantId { get; set; }
        public int UnitId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public string TenantContactNumber { get; set; } = string.Empty;
        public string? GovernmentId { get; set; }
        public int? GovernmentTypeId { get; set; }
        public string? GovernmentTypeName { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateTenantDetailsRequest
    {
        [JsonPropertyName("tenantName")]
        public required string TenantName { get; set; }
        
        [JsonPropertyName("tenantContactNumber")]
        public required string TenantContactNumber { get; set; }
        
        [JsonPropertyName("governmentId")]
        public string? GovernmentId { get; set; }
        
        [JsonPropertyName("governmentTypeId")]
        public int? GovernmentTypeId { get; set; }
    }

    // Statement DTOs
    public class TenantStatementDto
    {
        public int TenantId { get; set; }
        public TenantDetailsDto? TenantDetails { get; set; }
        public int Year { get; set; }
        public int Month { get; set; }
        public StatementSummaryDto? Summary { get; set; }
        public List<StatementLineItemDto> LineItems { get; set; } = new();
    }

    public class StatementSummaryDto
    {
        // Current month values
        public decimal TotalExpected { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal PendingAmount { get; set; }
        
        // All-time values
        public decimal TotalAllTimePending { get; set; }
    }

    public class StatementLineItemDto
    {
        public int LineItemId { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal RunningBalance { get; set; }
        public string? Comments { get; set; }
        public int? LinkedExpenseId { get; set; }
    }

    public class AddTenantExpenseRequest
    {
        [JsonPropertyName("expenseTypeId")]
        public required int ExpenseTypeId { get; set; }
        
        [JsonPropertyName("cycleId")]
        public required int CycleId { get; set; }
        
        [JsonPropertyName("amount")]
        public required decimal Amount { get; set; }
        
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }
        
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }
        
        [JsonPropertyName("comments")]
        public string? Comments { get; set; }
        
        [JsonPropertyName("isAlreadyPaid")]
        public bool IsAlreadyPaid { get; set; }
    }

    public class UpdateTenantExpenseRequest
    {
        [JsonPropertyName("expenseTypeId")]
        public int? ExpenseTypeId { get; set; }
        
        [JsonPropertyName("cycleId")]
        public int? CycleId { get; set; }
        
        [JsonPropertyName("amount")]
        public required decimal Amount { get; set; }
        
        [JsonPropertyName("startDate")]
        public DateTime? StartDate { get; set; }
        
        [JsonPropertyName("endDate")]
        public DateTime? EndDate { get; set; }
        
        [JsonPropertyName("comments")]
        public string? Comments { get; set; }
    }

    public class TenantExpenseDto
    {
        public int TenantExpenseId { get; set; }
        public int TenantId { get; set; }
        public int TenantExpenseTypeId { get; set; }
        public string? ExpenseTypeName { get; set; }
        public int TenantExpenseCycleId { get; set; }
        public string? CycleName { get; set; }
        public DateTime TenantExpenseStartDate { get; set; }
        public DateTime? TenantExpenseEndDate { get; set; }
        public decimal TenantExpenseAmount { get; set; }
        public string? Comments { get; set; }
    }

    public class RecordPaymentRequest
    {
        [JsonPropertyName("expenseTypeId")]
        public required int ExpenseTypeId { get; set; }
        
        [JsonPropertyName("amount")]
        public required decimal Amount { get; set; }
        
        [JsonPropertyName("linkedExpenseId")]
        public int? LinkedExpenseId { get; set; }
        
        [JsonPropertyName("comments")]
        public string? Comments { get; set; }
        
        [JsonPropertyName("isAlreadyPaid")]
        public bool IsAlreadyPaid { get; set; } = false;
        
        [JsonPropertyName("cycleId")]
        public int? CycleId { get; set; }
        
        [JsonPropertyName("paymentDate")]
        public DateTime? PaymentDate { get; set; }
    }
}
