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
        public required string TenantName { get; set; }
        public required string TenantContactNumber { get; set; }
        public string? GovernmentId { get; set; }
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
        public required int ExpenseTypeId { get; set; }
        public required int CycleId { get; set; }
        public required decimal Amount { get; set; }
        public string? Comments { get; set; }
        public bool IsAlreadyPaid { get; set; }
    }

    public class UpdateTenantExpenseRequest
    {
        public required decimal Amount { get; set; }
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
        public required int ExpenseTypeId { get; set; }
        public required decimal Amount { get; set; }
        public int? LinkedExpenseId { get; set; }
        public string? Comments { get; set; }
        public bool IsAlreadyPaid { get; set; } = false;
        public int? CycleId { get; set; }
    }
}
