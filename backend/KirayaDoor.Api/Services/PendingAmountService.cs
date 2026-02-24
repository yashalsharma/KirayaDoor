using KirayaDoor.Api.Data;
using KirayaDoor.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace KirayaDoor.Api.Services
{
    public class PendingAmountService
    {
        private readonly ApplicationDbContext _context;

        public PendingAmountService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Calculates the number of complete cycles due for a tenant expense based on:
        /// - TenantExpenseStartDate (date when first payment becomes due - advance payment)
        /// - TenantExpenseEndDate (if set)
        /// - TenantExpenseCycleId
        /// - Today's date
        /// 
        /// The start date counts as the first cycle (payment due immediately).
        /// Additional cycles are counted based on the cycle type.
        /// Only complete cycles are counted. 
        /// </summary>
        private int CalculateCyclesDue(TenantExpense expense, DateTime asOfDate)
        {
            // Get the cycle from database
            var cycle = _context.ExpenseCycles.FirstOrDefault(c => c.ExpenseCycleId == expense.TenantExpenseCycleId);
            if (cycle == null) return 0;

            // If expense hasn't started yet, no cycles are due
            if (expense.TenantExpenseStartDate > asOfDate)
                return 0;

            // Determine the end date (either TenantExpenseEndDate or today)
            var endDate = expense.TenantExpenseEndDate ?? asOfDate;

            // If expense ended before today, use the end date for calculation
            if (expense.TenantExpenseEndDate.HasValue && expense.TenantExpenseEndDate.Value < asOfDate)
                endDate = expense.TenantExpenseEndDate.Value;

            int cyclesDue = 0;
            var startDate = expense.TenantExpenseStartDate;

            // First cycle is always due on the start date (advance payment)
            cyclesDue = 1;

            switch (cycle.ExpenseCycleName.ToLower())
            {
                case "onetime":
                    // One-time expense: only 1 cycle due
                    cyclesDue = 1;
                    break;

                case "month":
                    // First cycle due at start date
                    // Count additional complete months after that
                    var monthlyDate = startDate.AddMonths(1);
                    while (monthlyDate <= endDate)
                    {
                        cyclesDue++;
                        monthlyDate = monthlyDate.AddMonths(1);
                    }
                    break;

                case "quarter":
                    // First cycle due at start date
                    // Count additional complete 3-month periods after that
                    var quarterDate = startDate.AddMonths(3);
                    while (quarterDate <= endDate)
                    {
                        cyclesDue++;
                        quarterDate = quarterDate.AddMonths(3);
                    }
                    break;

                case "halfyear":
                    // First cycle due at start date
                    // Count additional complete 6-month periods after that
                    var halfYearDate = startDate.AddMonths(6);
                    while (halfYearDate <= endDate)
                    {
                        cyclesDue++;
                        halfYearDate = halfYearDate.AddMonths(6);
                    }
                    break;

                case "annual":
                    // First cycle due at start date
                    // Count additional complete 12-month periods after that
                    var annualDate = startDate.AddYears(1);
                    while (annualDate <= endDate)
                    {
                        cyclesDue++;
                        annualDate = annualDate.AddYears(1);
                    }
                    break;
            }

            return Math.Max(0, cyclesDue);
        }

        /// <summary>
        /// Calculates the pro-rata amount for partial cycle at the end of the expense period.
        /// This applies when the expense ends before a complete cycle would occur.
        /// </summary>
        private decimal CalculateProRataAmount(TenantExpense expense, DateTime asOfDate)
        {
            // Get the cycle from database
            var cycle = _context.ExpenseCycles.FirstOrDefault(c => c.ExpenseCycleId == expense.TenantExpenseCycleId);
            if (cycle == null) return 0;

            // If expense hasn't started yet, no pro-rata
            if (expense.TenantExpenseStartDate > asOfDate)
                return 0;

            // If no end date is set, expense is still ongoing - no pro-rata yet
            if (!expense.TenantExpenseEndDate.HasValue)
                return 0;

            var endDate = expense.TenantExpenseEndDate.Value;

            // If end date is in the future, no pro-rata calculation needed yet
            if (endDate > asOfDate)
                return 0;

            var startDate = expense.TenantExpenseStartDate;

            // Find where the last complete cycle ends
            DateTime lastCycleDate = startDate;

            switch (cycle.ExpenseCycleName.ToLower())
            {
                case "onetime":
                    // One-time expenses don't have pro-rata
                    return 0;

                case "month":
                    // Find the last complete month
                    var monthlyDate = startDate.AddMonths(1);
                    while (monthlyDate <= endDate)
                    {
                        lastCycleDate = monthlyDate;
                        monthlyDate = monthlyDate.AddMonths(1);
                    }
                    // If there are days remaining after the last cycle
                    if (endDate > lastCycleDate)
                    {
                        int daysElapsed = (endDate - lastCycleDate).Days;
                        int daysInMonth = DateTime.DaysInMonth(endDate.Year, endDate.Month);
                        decimal proRataRatio = (decimal)daysElapsed / daysInMonth;
                        return expense.TenantExpenseAmount * proRataRatio;
                    }
                    return 0;

                case "quarter":
                    // Find the last complete quarter
                    var quarterDate = startDate.AddMonths(3);
                    while (quarterDate <= endDate)
                    {
                        lastCycleDate = quarterDate;
                        quarterDate = quarterDate.AddMonths(3);
                    }
                    // If there are days remaining after the last cycle
                    if (endDate > lastCycleDate)
                    {
                        int daysElapsed = (endDate - lastCycleDate).Days;
                        int daysInQuarter = 92; // Average, but could be 90-92 depending on months
                        decimal proRataRatio = (decimal)daysElapsed / daysInQuarter;
                        return expense.TenantExpenseAmount * proRataRatio;
                    }
                    return 0;

                case "halfyear":
                    // Find the last complete half-year
                    var halfYearDate = startDate.AddMonths(6);
                    while (halfYearDate <= endDate)
                    {
                        lastCycleDate = halfYearDate;
                        halfYearDate = halfYearDate.AddMonths(6);
                    }
                    // If there are days remaining after the last cycle
                    if (endDate > lastCycleDate)
                    {
                        int daysElapsed = (endDate - lastCycleDate).Days;
                        int daysInHalfYear = 183; // Average
                        decimal proRataRatio = (decimal)daysElapsed / daysInHalfYear;
                        return expense.TenantExpenseAmount * proRataRatio;
                    }
                    return 0;

                case "annual":
                    // Find the last complete year
                    var annualDate = startDate.AddYears(1);
                    while (annualDate <= endDate)
                    {
                        lastCycleDate = annualDate;
                        annualDate = annualDate.AddYears(1);
                    }
                    // If there are days remaining after the last cycle
                    if (endDate > lastCycleDate)
                    {
                        int daysElapsed = (endDate - lastCycleDate).Days;
                        int daysInYear = DateTime.IsLeapYear(endDate.Year) ? 366 : 365;
                        decimal proRataRatio = (decimal)daysElapsed / daysInYear;
                        return expense.TenantExpenseAmount * proRataRatio;
                    }
                    return 0;
            }

            return 0;
        }

        /// <summary>
        /// Calculates the pending amount (due - paid) for a specific TenantExpense
        /// Includes full cycles plus pro-rata for partial final cycle
        /// </summary>
        public async Task<decimal> CalculateTenantExpensePendingAmountAsync(int tenantExpenseId)
        {
            var expense = await _context.TenantExpenses
                .Include(te => te.PaidExpenses)
                .Include(te => te.ExpenseCycle)
                .FirstOrDefaultAsync(te => te.TenantExpenseId == tenantExpenseId);

            if (expense == null)
                return 0;

            // Calculate how many complete cycles are due
            int cyclesDue = CalculateCyclesDue(expense, DateTime.UtcNow);

            // Calculate pro-rata amount for partial cycle
            decimal proRataAmount = CalculateProRataAmount(expense, DateTime.UtcNow);

            // Calculate total expected amount
            decimal expectedAmount = (cyclesDue * expense.TenantExpenseAmount) + proRataAmount;

            // Sum up all payments made for this expense
            decimal totalPaid = expense.PaidExpenses?.Sum(pe => pe.PaymentAmount) ?? 0;

            // Pending is expected minus paid
            return Math.Max(0, expectedAmount - totalPaid);
        }

        /// <summary>
        /// Calculates the total pending amount for a specific tenant (all their expenses combined)
        /// Includes full cycles plus pro-rata for partial final cycles
        /// </summary>
        public async Task<decimal> CalculateTenantPendingAmountAsync(int tenantId)
        {
            var tenantExpenses = await _context.TenantExpenses
                .Where(te => te.TenantId == tenantId)
                .Include(te => te.PaidExpenses)
                .Include(te => te.ExpenseCycle)
                .ToListAsync();

            decimal totalPending = 0;

            foreach (var expense in tenantExpenses)
            {
                int cyclesDue = CalculateCyclesDue(expense, DateTime.UtcNow);
                decimal proRataAmount = CalculateProRataAmount(expense, DateTime.UtcNow);
                decimal expectedAmount = (cyclesDue * expense.TenantExpenseAmount) + proRataAmount;
                decimal totalPaid = expense.PaidExpenses?.Sum(pe => pe.PaymentAmount) ?? 0;
                totalPending += Math.Max(0, expectedAmount - totalPaid);
            }

            return totalPending;
        }

        /// <summary>
        /// Calculates the total pending amount for a unit (all tenants in that unit)
        /// </summary>
        public async Task<decimal> CalculateUnitPendingAmountAsync(int unitId)
        {
            var tenants = await _context.Tenants
                .Where(t => t.UnitId == unitId)
                .Select(t => t.TenantId)
                .ToListAsync();

            decimal totalPending = 0;

            foreach (var tenantId in tenants)
            {
                totalPending += await CalculateTenantPendingAmountAsync(tenantId);
            }

            return totalPending;
        }

        /// <summary>
        /// Calculates the total pending amount for a property (all units in that property)
        /// </summary>
        public async Task<decimal> CalculatePropertyPendingAmountAsync(int propertyId)
        {
            var units = await _context.Units
                .Where(u => u.PropertyId == propertyId)
                .Select(u => u.UnitId)
                .ToListAsync();

            decimal totalPending = 0;

            foreach (var unitId in units)
            {
                totalPending += await CalculateUnitPendingAmountAsync(unitId);
            }

            return totalPending;
        }

        /// <summary>
        /// Calculates pending amounts with detailed breakdown
        /// </summary>
        public async Task<PendingAmountBreakdown> GetPropertyPendingAmountBreakdownAsync(int propertyId)
        {
            var units = await _context.Units
                .Where(u => u.PropertyId == propertyId)
                .AsNoTracking()
                .ToListAsync();

            var breakdown = new PendingAmountBreakdown
            {
                PropertyId = propertyId,
                Units = new List<UnitPendingAmountBreakdown>()
            };

            foreach (var unit in units)
            {
                var tenants = await _context.Tenants
                    .Where(t => t.UnitId == unit.UnitId)
                    .AsNoTracking()
                    .ToListAsync();

                var unitBreakdown = new UnitPendingAmountBreakdown
                {
                    UnitId = unit.UnitId,
                    UnitName = unit.UnitName,
                    Tenants = new List<TenantPendingAmountBreakdown>()
                };

                foreach (var tenant in tenants)
                {
                    var tenantBreakdown = new TenantPendingAmountBreakdown
                    {
                        TenantId = tenant.TenantId,
                        TenantName = tenant.TenantName,
                        Expenses = new List<ExpensePendingBreakdown>()
                    };

                    var tenantExpenses = await _context.TenantExpenses
                        .Where(te => te.TenantId == tenant.TenantId)
                        .Include(te => te.PaidExpenses)
                        .Include(te => te.ExpenseType)
                        .Include(te => te.ExpenseCycle)
                        .AsNoTracking()
                        .ToListAsync();

                    foreach (var expense in tenantExpenses)
                    {
                        int cyclesDue = CalculateCyclesDue(expense, DateTime.UtcNow);
                        decimal proRataAmount = CalculateProRataAmount(expense, DateTime.UtcNow);
                        decimal expectedAmount = (cyclesDue * expense.TenantExpenseAmount) + proRataAmount;
                        decimal totalPaid = expense.PaidExpenses?.Sum(pe => pe.PaymentAmount) ?? 0;
                        decimal pending = Math.Max(0, expectedAmount - totalPaid);

                        tenantBreakdown.Expenses.Add(new ExpensePendingBreakdown
                        {
                            TenantExpenseId = expense.TenantExpenseId,
                            ExpenseType = expense.ExpenseType?.ExpenseTypeName ?? "Unknown",
                            CycleName = expense.ExpenseCycle?.ExpenseCycleName ?? "Unknown",
                            CycleAmount = expense.TenantExpenseAmount,
                            CyclesDue = cyclesDue,
                            ProRataAmount = proRataAmount,
                            ExpectedAmount = expectedAmount,
                            TotalPaid = totalPaid,
                            PendingAmount = pending
                        });

                        tenantBreakdown.TotalPending += pending;
                    }

                    unitBreakdown.Tenants.Add(tenantBreakdown);
                    unitBreakdown.TotalPending += tenantBreakdown.TotalPending;
                }

                breakdown.Units.Add(unitBreakdown);
                breakdown.TotalPending += unitBreakdown.TotalPending;
            }

            return breakdown;
        }
    }

    // DTOs for breakdown reporting
    public class PendingAmountBreakdown
    {
        public int PropertyId { get; set; }
        public decimal TotalPending { get; set; } = 0;
        public List<UnitPendingAmountBreakdown> Units { get; set; } = new();
    }

    public class UnitPendingAmountBreakdown
    {
        public int UnitId { get; set; }
        public string UnitName { get; set; } = "";
        public decimal TotalPending { get; set; } = 0;
        public List<TenantPendingAmountBreakdown> Tenants { get; set; } = new();
    }

    public class TenantPendingAmountBreakdown
    {
        public int TenantId { get; set; }
        public string TenantName { get; set; } = "";
        public decimal TotalPending { get; set; } = 0;
        public List<ExpensePendingBreakdown> Expenses { get; set; } = new();
    }

    public class ExpensePendingBreakdown
    {
        public int TenantExpenseId { get; set; }
        public string ExpenseType { get; set; } = "";
        public string CycleName { get; set; } = "";
        public decimal CycleAmount { get; set; }
        public int CyclesDue { get; set; }
        public decimal ProRataAmount { get; set; }
        public decimal ExpectedAmount { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal PendingAmount { get; set; }
    }
}
