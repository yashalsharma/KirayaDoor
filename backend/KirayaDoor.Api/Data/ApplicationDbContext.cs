using Microsoft.EntityFrameworkCore;

namespace KirayaDoor.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Entities.User> Users { get; set; }
    public DbSet<Entities.UserType> UserTypes { get; set; }
    public DbSet<Entities.Address> Addresses { get; set; }
    public DbSet<Entities.Property> Properties { get; set; }
    public DbSet<Entities.Unit> Units { get; set; }
    public DbSet<Entities.Tenant> Tenants { get; set; }
    public DbSet<Entities.ExpenseType> ExpenseTypes { get; set; }
    public DbSet<Entities.ExpenseCycle> ExpenseCycles { get; set; }
    public DbSet<Entities.TenantExpense> TenantExpenses { get; set; }
    public DbSet<Entities.PaidExpense> PaidExpenses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User-UserType relationship
        modelBuilder.Entity<Entities.User>()
            .HasOne(u => u.UserType)
            .WithMany()
            .HasForeignKey(u => u.UserTypeId)
            .IsRequired();

        // Seed ExpenseTypes
        modelBuilder.Entity<Entities.ExpenseType>().HasData(
            new Entities.ExpenseType { ExpenseTypeId = 1, ExpenseTypeName = "Rent" },
            new Entities.ExpenseType { ExpenseTypeId = 2, ExpenseTypeName = "SecurityDeposit" },
            new Entities.ExpenseType { ExpenseTypeId = 3, ExpenseTypeName = "Electricity" },
            new Entities.ExpenseType { ExpenseTypeId = 4, ExpenseTypeName = "Water" },
            new Entities.ExpenseType { ExpenseTypeId = 100, ExpenseTypeName = "Others" }
        );

        // Seed ExpenseCycles
        modelBuilder.Entity<Entities.ExpenseCycle>().HasData(
            new Entities.ExpenseCycle { ExpenseCycleId = 1, ExpenseCycleName = "OneTime" },
            new Entities.ExpenseCycle { ExpenseCycleId = 2, ExpenseCycleName = "Month" },
            new Entities.ExpenseCycle { ExpenseCycleId = 3, ExpenseCycleName = "Quarter" },
            new Entities.ExpenseCycle { ExpenseCycleId = 4, ExpenseCycleName = "HalfYear" },
            new Entities.ExpenseCycle { ExpenseCycleId = 5, ExpenseCycleName = "Annual" }
        );
    }
}
