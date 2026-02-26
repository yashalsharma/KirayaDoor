using Microsoft.EntityFrameworkCore;
using KirayaDoor.Api.Data;
using KirayaDoor.Api.Data.Entities;
using KirayaDoor.Api.Controllers;

namespace KirayaDoor.Api.Services
{
    public interface ITenantStatementService
    {
        Task<TenantStatementDto?> GetMonthlyStatementAsync(int tenantId, int year, int month);
        Task<List<TenantExpenseDto>> GetTenantActiveExpensesAsync(int tenantId);
        Task<StatementLineItemDto?> AddTenantExpenseAsync(int tenantId, AddTenantExpenseRequest request);
        Task<StatementLineItemDto?> UpdateTenantExpenseAsync(int tenantId, int tenantExpenseId, UpdateTenantExpenseRequest request);
        Task<bool> RetireTenantExpenseAsync(int tenantId, int tenantExpenseId);
        Task<StatementLineItemDto?> RecordPaymentAsync(int tenantId, RecordPaymentRequest request);
        Task<bool> DeleteTenantAsync(int tenantId);
        Task<bool> MarkTenantAsInactiveAsync(int tenantId);
    }

    public class TenantStatementService : ITenantStatementService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TenantStatementService> _logger;

        public TenantStatementService(ApplicationDbContext context, ILogger<TenantStatementService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TenantStatementDto?> GetMonthlyStatementAsync(int tenantId, int year, int month)
        {
            try
            {
                // Verify tenant exists
                var tenant = await _context.Tenants
                    .Where(t => t.TenantId == tenantId)
                    .Include(t => t.GovernmentIdType)
                    .FirstOrDefaultAsync();

                if (tenant == null)
                {
                    _logger.LogWarning($"Tenant not found: {tenantId}");
                    return null;
                }

                // Calculate statement date range
                var statementDate = new DateTime(year, month, 1);
                var monthEnd = statementDate.AddMonths(1).AddDays(-1);

                // Get all active expenses for this tenant
                var activeExpenses = await _context.TenantExpenses
                    .Where(te => te.TenantId == tenantId && 
                           (te.TenantExpenseEndDate == null || te.TenantExpenseEndDate >= statementDate))
                    .Include(te => te.ExpenseType)
                    .Include(te => te.ExpenseCycle)
                    .OrderBy(te => te.TenantExpenseStartDate)
                    .ToListAsync();

                // Get all payments for this month
                var monthlyPayments = await _context.PaidExpenses
                    .Where(pe => pe.TenantId == tenantId &&
                           pe.PaymentDate.Year == year &&
                           pe.PaymentDate.Month == month)
                    .Include(pe => pe.ExpenseType)
                    .OrderBy(pe => pe.PaymentDate)
                    .ToListAsync();

                // Build statement
                var statement = new TenantStatementDto
                {
                    TenantId = tenantId,
                    Year = year,
                    Month = month,
                    TenantDetails = MapToDetailsDto(tenant),
                    LineItems = new List<StatementLineItemDto>()
                };

                // Calculate expected amounts and build line items
                decimal totalExpected = 0m;
                decimal totalPaid = 0m;
                decimal runningBalance = 0m;

                var lineItems = new List<(DateTime date, StatementLineItemDto item)>();

                // Add expected expense items
                foreach (var expense in activeExpenses)
                {
                    var dueDates = CalculateDueDatesForMonth(expense, statementDate, monthEnd);
                    
                    foreach (var dueDate in dueDates)
                    {
                        var item = new StatementLineItemDto
                        {
                            LineItemId = expense.TenantExpenseId,
                            Date = dueDate,
                            Type = "Expense",
                            Description = $"{expense.ExpenseType?.ExpenseTypeName} ({expense.ExpenseCycle?.ExpenseCycleName})",
                            Amount = expense.TenantExpenseAmount,
                            LinkedExpenseId = expense.TenantExpenseId
                        };

                        lineItems.Add((dueDate, item));
                        totalExpected += expense.TenantExpenseAmount;
                    }
                }

                // Add payment items
                foreach (var payment in monthlyPayments)
                {
                    var item = new StatementLineItemDto
                    {
                        LineItemId = payment.PaidExpenseId,
                        Date = payment.PaymentDate,
                        Type = "Payment",
                        Description = $"Payment - {payment.ExpenseType?.ExpenseTypeName}",
                        Amount = -payment.PaymentAmount,
                        Comments = payment.Comments,
                        LinkedExpenseId = payment.TenantExpenseId
                    };

                    lineItems.Add((payment.PaymentDate, item));
                    totalPaid += payment.PaymentAmount;
                }

                // Sort by date and calculate running balance
                lineItems = lineItems.OrderBy(x => x.date).ToList();
                foreach (var (date, item) in lineItems)
                {
                    runningBalance += item.Amount;
                    item.RunningBalance = runningBalance;
                    statement.LineItems.Add(item);
                }

                // Calculate summary
                statement.Summary = new StatementSummaryDto
                {
                    TotalExpected = totalExpected,
                    TotalPaid = totalPaid,
                    PendingAmount = totalExpected - totalPaid
                };

                // Calculate total all-time pending (across all months)
                var allExpenses = await _context.TenantExpenses
                    .Where(te => te.TenantId == tenantId)
                    .Include(te => te.ExpenseType)
                    .OrderBy(te => te.TenantExpenseStartDate)
                    .ToListAsync();
                
                var allPayments = await _context.PaidExpenses
                    .Where(pe => pe.TenantId == tenantId)
                    .Include(pe => pe.ExpenseType)
                    .OrderBy(pe => pe.PaymentDate)
                    .ToListAsync();

                decimal totalAllExpected = 0m;
                decimal totalAllPaid = 0m;

                // Calculate total expected from all expenses
                foreach (var expense in allExpenses)
                {
                    // Count each expense based on its cycle type
                    var cycleName = expense.ExpenseCycle?.ExpenseCycleName?.ToLower() ?? "monthly";
                    var expenseEndDate = expense.TenantExpenseEndDate ?? DateTime.MaxValue;

                    if (cycleName.Contains("onetime"))
                    {
                        if (expense.TenantExpenseStartDate <= DateTime.Today)
                            totalAllExpected += expense.TenantExpenseAmount;
                    }
                    else if (cycleName.Contains("month"))
                    {
                        var currentDate = expense.TenantExpenseStartDate;
                        while (currentDate <= DateTime.Today && currentDate <= expenseEndDate)
                        {
                            totalAllExpected += expense.TenantExpenseAmount;
                            currentDate = currentDate.AddMonths(1);
                        }
                    }
                    else if (cycleName.Contains("quarter"))
                    {
                        var currentDate = expense.TenantExpenseStartDate;
                        while (currentDate <= DateTime.Today && currentDate <= expenseEndDate)
                        {
                            totalAllExpected += expense.TenantExpenseAmount;
                            currentDate = currentDate.AddMonths(3);
                        }
                    }
                    else if (cycleName.Contains("halfyear") || cycleName.Contains("half-year") || cycleName.Contains("semi"))
                    {
                        var currentDate = expense.TenantExpenseStartDate;
                        while (currentDate <= DateTime.Today && currentDate <= expenseEndDate)
                        {
                            totalAllExpected += expense.TenantExpenseAmount;
                            currentDate = currentDate.AddMonths(6);
                        }
                    }
                    else if (cycleName.Contains("annual") || cycleName.Contains("yearly"))
                    {
                        var currentDate = expense.TenantExpenseStartDate;
                        while (currentDate <= DateTime.Today && currentDate <= expenseEndDate)
                        {
                            totalAllExpected += expense.TenantExpenseAmount;
                            currentDate = currentDate.AddYears(1);
                        }
                    }
                }

                totalAllPaid = allPayments.Sum(p => p.PaymentAmount);
                statement.Summary.TotalAllTimePending = totalAllExpected - totalAllPaid;

                return statement;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating statement for tenant {tenantId}: {ex.Message}");
                throw;
            }
        }

        public async Task<List<TenantExpenseDto>> GetTenantActiveExpensesAsync(int tenantId)
        {
            try
            {
                var activeExpenses = await _context.TenantExpenses
                    .Where(te => te.TenantId == tenantId && te.TenantExpenseEndDate == null)
                    .Include(te => te.ExpenseType)
                    .Include(te => te.ExpenseCycle)
                    .OrderBy(te => te.TenantExpenseStartDate)
                    .ToListAsync();

                return activeExpenses.Select(te => new TenantExpenseDto
                {
                    TenantExpenseId = te.TenantExpenseId,
                    TenantId = te.TenantId,
                    TenantExpenseTypeId = te.TenantExpenseTypeId,
                    ExpenseTypeName = te.ExpenseType?.ExpenseTypeName,
                    TenantExpenseCycleId = te.TenantExpenseCycleId,
                    CycleName = te.ExpenseCycle?.ExpenseCycleName,
                    TenantExpenseStartDate = te.TenantExpenseStartDate,
                    TenantExpenseEndDate = te.TenantExpenseEndDate,
                    TenantExpenseAmount = te.TenantExpenseAmount,
                    Comments = te.Comments
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting active expenses for tenant {tenantId}: {ex.Message}");
                throw;
            }
        }

        public async Task<StatementLineItemDto?> AddTenantExpenseAsync(int tenantId, AddTenantExpenseRequest request)
        {
            try
            {
                var tenant = await _context.Tenants.FindAsync(tenantId);
                if (tenant == null)
                    return null;

                var expenseType = await _context.ExpenseTypes.FindAsync(request.ExpenseTypeId);
                if (expenseType == null)
                    throw new ArgumentException("Invalid expense type");

                var cycle = await _context.ExpenseCycles.FindAsync(request.CycleId);
                if (cycle == null)
                    throw new ArgumentException("Invalid cycle type");

                var expense = new TenantExpense
                {
                    TenantId = tenantId,
                    TenantExpenseTypeId = request.ExpenseTypeId,
                    TenantExpenseCycleId = request.CycleId,
                    TenantExpenseStartDate = DateTime.Today,
                    TenantExpenseAmount = request.Amount,
                    Comments = request.Comments
                };

                _context.TenantExpenses.Add(expense);
                await _context.SaveChangesAsync();

                // If marked as already paid, create a corresponding PaidExpense record
                if (request.IsAlreadyPaid)
                {
                    var paidExpense = new PaidExpense
                    {
                        TenantId = tenantId,
                        ExpenseTypeId = request.ExpenseTypeId,
                        TenantExpenseId = expense.TenantExpenseId,
                        PaymentAmount = request.Amount,
                        PaymentDate = DateTime.Today,
                        Comments = request.Comments
                    };

                    _context.PaidExpenses.Add(paidExpense);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Paid expense created for tenant {tenantId}: {paidExpense.PaidExpenseId}, linked to expense {expense.TenantExpenseId}");
                }

                _logger.LogInformation($"Expense added for tenant {tenantId}: {expense.TenantExpenseId}");

                return new StatementLineItemDto
                {
                    LineItemId = expense.TenantExpenseId,
                    Date = expense.TenantExpenseStartDate,
                    Type = "Expense",
                    Description = $"{expenseType.ExpenseTypeName}",
                    Amount = request.Amount,
                    LinkedExpenseId = expense.TenantExpenseId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding expense: {ex.Message}");
                throw;
            }
        }

        public async Task<StatementLineItemDto?> UpdateTenantExpenseAsync(int tenantId, int tenantExpenseId, UpdateTenantExpenseRequest request)
        {
            try
            {
                var expense = await _context.TenantExpenses
                    .Where(te => te.TenantExpenseId == tenantExpenseId && te.TenantId == tenantId)
                    .Include(te => te.ExpenseType)
                    .FirstOrDefaultAsync();

                if (expense == null)
                    return null;

                // Only allow update for same month expenses
                var today = DateTime.Today;
                if (expense.TenantExpenseStartDate.Year != today.Year ||
                    expense.TenantExpenseStartDate.Month != today.Month)
                {
                    throw new InvalidOperationException("Cannot update expenses from previous months");
                }

                expense.TenantExpenseAmount = request.Amount;
                expense.Comments = request.Comments;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Expense updated: {tenantExpenseId}");

                return new StatementLineItemDto
                {
                    LineItemId = expense.TenantExpenseId,
                    Date = expense.TenantExpenseStartDate,
                    Type = "Expense",
                    Description = $"{expense.ExpenseType?.ExpenseTypeName}",
                    Amount = request.Amount,
                    LinkedExpenseId = expense.TenantExpenseId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating expense: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> RetireTenantExpenseAsync(int tenantId, int tenantExpenseId)
        {
            try
            {
                var expense = await _context.TenantExpenses
                    .Where(te => te.TenantExpenseId == tenantExpenseId && te.TenantId == tenantId)
                    .FirstOrDefaultAsync();

                if (expense == null)
                    return false;

                // Set end date to today
                expense.TenantExpenseEndDate = DateTime.Today;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Expense retired: {tenantExpenseId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retiring expense: {ex.Message}");
                throw;
            }
        }

        public async Task<StatementLineItemDto?> RecordPaymentAsync(int tenantId, RecordPaymentRequest request)
        {
            try
            {
                var expenseType = await _context.ExpenseTypes.FindAsync(request.ExpenseTypeId);
                if (expenseType == null)
                    throw new ArgumentException("Invalid expense type");

                int? linkedExpenseId = request.LinkedExpenseId;

                // If payment is for an already-paid expense, create both TenantExpense and PaidExpense
                if (request.IsAlreadyPaid)
                {
                    if (request.CycleId == null)
                        throw new ArgumentException("Cycle type is required for already paid expenses");

                    var cycle = await _context.ExpenseCycles.FindAsync(request.CycleId);
                    if (cycle == null)
                        throw new ArgumentException("Invalid cycle type");

                    var tenant = await _context.Tenants.FindAsync(tenantId);
                    if (tenant == null)
                        throw new ArgumentException("Tenant not found");

                    // Create TenantExpense record
                    var expense = new TenantExpense
                    {
                        TenantId = tenantId,
                        TenantExpenseTypeId = request.ExpenseTypeId,
                        TenantExpenseCycleId = request.CycleId.Value,
                        TenantExpenseStartDate = DateTime.Today,
                        TenantExpenseAmount = request.Amount,
                        Comments = request.Comments
                    };

                    _context.TenantExpenses.Add(expense);
                    await _context.SaveChangesAsync();

                    linkedExpenseId = expense.TenantExpenseId;
                }

                // Create PaidExpense record
                var payment = new PaidExpense
                {
                    TenantId = tenantId,
                    ExpenseTypeId = request.ExpenseTypeId,
                    TenantExpenseId = linkedExpenseId,
                    PaymentDate = DateTime.Today,
                    PaymentAmount = request.Amount,
                    Comments = request.Comments
                };

                _context.PaidExpenses.Add(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment recorded for tenant {tenantId}: {payment.PaidExpenseId}");

                return new StatementLineItemDto
                {
                    LineItemId = payment.PaidExpenseId,
                    Date = payment.PaymentDate,
                    Type = "Payment",
                    Description = $"Payment - {expenseType.ExpenseTypeName}",
                    Amount = -request.Amount,
                    Comments = request.Comments,
                    LinkedExpenseId = linkedExpenseId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error recording payment: {ex.Message}");
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

        private List<DateTime> CalculateDueDatesForMonth(TenantExpense expense, DateTime monthStart, DateTime monthEnd)
        {
            var dueDates = new List<DateTime>();
            var today = DateTime.Today;

            // Get cycle type name
            var cycleName = expense.ExpenseCycle?.ExpenseCycleName?.ToLower() ?? "monthly";
            
            // Check if this is an advance payment type (Rent is an advance payment)
            var expenseTypeName = expense.ExpenseType?.ExpenseTypeName ?? "Unknown";
            var isAdvancePayment = expenseTypeName.ToLower() == "rent";
            
            _logger.LogInformation($"CalculateDueDatesForMonth - ExpenseType: {expenseTypeName}, Cycle: {expense.ExpenseCycle?.ExpenseCycleName}, StartDate: {expense.TenantExpenseStartDate}, IsAdvancePayment: {isAdvancePayment}");

            if (cycleName.Contains("onetime"))
            {
                // One-time expense is due on start date if within month
                // For advance payments (like rent), don't require it to be paid already
                var dateCheck = isAdvancePayment ? monthEnd : today;
                if (expense.TenantExpenseStartDate >= monthStart && 
                    expense.TenantExpenseStartDate <= monthEnd &&
                    expense.TenantExpenseStartDate <= dateCheck)
                {
                    dueDates.Add(expense.TenantExpenseStartDate);
                }
            }
            else if (cycleName.Contains("month"))
            {
                // Monthly: start date and each anniversary
                var currentDate = expense.TenantExpenseStartDate;
                var dateCheck = isAdvancePayment ? monthEnd : today;
                while (currentDate <= monthEnd && currentDate <= dateCheck)
                {
                    if (currentDate >= monthStart)
                    {
                        dueDates.Add(currentDate);
                    }
                    currentDate = currentDate.AddMonths(1);
                }
            }
            else if (cycleName.Contains("quarterly"))
            {
                // Quarterly: every 3 months
                var currentDate = expense.TenantExpenseStartDate;
                var dateCheck = isAdvancePayment ? monthEnd : today;
                while (currentDate <= monthEnd && currentDate <= dateCheck)
                {
                    if (currentDate >= monthStart)
                    {
                        dueDates.Add(currentDate);
                    }
                    currentDate = currentDate.AddMonths(3);
                }
            }
            else if (cycleName.Contains("halfyear") || cycleName.Contains("half-year") || cycleName.Contains("semi"))
            {
                // Semi-annual: every 6 months
                var currentDate = expense.TenantExpenseStartDate;
                var dateCheck = isAdvancePayment ? monthEnd : today;
                while (currentDate <= monthEnd && currentDate <= dateCheck)
                {
                    if (currentDate >= monthStart)
                    {
                        dueDates.Add(currentDate);
                    }
                    currentDate = currentDate.AddMonths(6);
                }
            }
            else if (cycleName.Contains("annual") || cycleName.Contains("yearly"))
            {
                // Annual: every 12 months
                var currentDate = expense.TenantExpenseStartDate;
                var dateCheck = isAdvancePayment ? monthEnd : today;
                while (currentDate <= monthEnd && currentDate <= dateCheck)
                {
                    if (currentDate >= monthStart)
                    {
                        dueDates.Add(currentDate);
                    }
                    currentDate = currentDate.AddYears(1);
                }
            }

            return dueDates;
        }

        public async Task<bool> DeleteTenantAsync(int tenantId)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.TenantId == tenantId)
                    .FirstOrDefaultAsync();

                if (tenant == null)
                    return false;

                // Delete all PaidExpenses for this tenant
                var paidExpenses = await _context.PaidExpenses
                    .Where(pe => pe.TenantId == tenantId)
                    .ToListAsync();
                _context.PaidExpenses.RemoveRange(paidExpenses);

                // Delete all TenantExpenses for this tenant
                var tenantExpenses = await _context.TenantExpenses
                    .Where(te => te.TenantId == tenantId)
                    .ToListAsync();
                _context.TenantExpenses.RemoveRange(tenantExpenses);

                // Delete the tenant
                _context.Tenants.Remove(tenant);

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Tenant deleted: {tenantId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting tenant: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> MarkTenantAsInactiveAsync(int tenantId)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Where(t => t.TenantId == tenantId)
                    .FirstOrDefaultAsync();

                if (tenant == null)
                    return false;

                tenant.IsActive = false;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Tenant marked as inactive: {tenantId}");

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking tenant as inactive: {ex.Message}");
                throw;
            }
        }
    }
}
