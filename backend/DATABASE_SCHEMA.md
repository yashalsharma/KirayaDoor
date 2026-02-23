# KirayaDoor Database Schema Documentation

## Overview
This document describes all the database tables created for the KirayaDoor property management system, including their columns, constraints, and relationships.

---

## Master/Reference Tables

### 1. **dbo.ExpenseTypes** (Master Table)
Reference table for different types of expenses.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| ExpenseTypeId | int | PK, IDENTITY(1,1) | Primary Key |
| ExpenseTypeName | nvarchar(50) | NOT NULL | Type of expense |

**Seeded Values:**
- 1: Rent
- 2: SecurityDeposit
- 3: Electricity
- 4: Water
- 100: Others

---

### 2. **dbo.ExpenseCycles** (Master Table)
Reference table for different expense cycles/frequencies.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| ExpenseCycleId | int | PK, IDENTITY(1,1) | Primary Key |
| ExpenseCycleName | nvarchar(50) | NOT NULL | Frequency of expense |

**Seeded Values:**
- 1: OneTime
- 2: Month
- 3: Quarter
- 4: HalfYear
- 5: Annual

---

## Transactional Tables

### 3. **dbo.Addresses**
Stores address information for properties, including optional GPS coordinates.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| AddressId | int | PK, IDENTITY(1,1) | Primary Key |
| AddressText | nvarchar(500) | NOT NULL | Full address text |
| Location | nvarchar(100) | NULL | GPS coordinates for maps |

**Relationships:**
- One Address can have many Properties (1:N)

---

### 4. **dbo.Properties**
Stores property information owned by users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| PropertyId | int | PK, IDENTITY(1,1) | Primary Key |
| PropertyName | nvarchar(200) | NOT NULL | Name of the property |
| UnitCount | int | NOT NULL | Number of units in property |
| OwnerId | int | FK, NOT NULL | References Users.UserId |
| AddressId | int | FK, NOT NULL | References Addresses.AddressId |

**Relationships:**
- FK to Users (OwnerId) - Many Properties per User
- FK to Addresses (AddressId) - Many Properties per Address
- One Property can have many Units (1:N)

---

### 5. **dbo.Units**
Stores individual units within a property (e.g., flats, apartments).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| UnitId | int | PK, IDENTITY(1,1) | Primary Key |
| UnitName | nvarchar(100) | NOT NULL | Name/number of unit |
| PropertyId | int | FK, NOT NULL | References Properties.PropertyId |

**Relationships:**
- FK to Properties (PropertyId) - Many Units per Property
- One Unit can have many Tenants (1:N)

---

### 6. **dbo.Tenants**
Stores tenant information for units.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| TenantId | int | PK, IDENTITY(1,1) | Primary Key |
| UnitId | int | FK, NOT NULL | References Units.UnitId |
| TenantName | nvarchar(100) | NOT NULL | Full name of tenant |
| TenantContactNumber | nvarchar(15) | NOT NULL | Contact phone number |
| IsActive | bit | NOT NULL, DEFAULT=1 | Whether tenant is currently active |

**Relationships:**
- FK to Units (UnitId) - Many Tenants per Unit
- One Tenant can have many TenantExpenses (1:N)
- One Tenant can have many PaidExpenses (1:N)

---

### 7. **dbo.TenantExpenses**
Stores recurring or one-time expense records for tenants.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| TenantExpenseId | int | PK, IDENTITY(1,1) | Primary Key |
| TenantId | int | FK, NOT NULL | References Tenants.TenantId |
| TenantExpenseTypeId | int | FK, NOT NULL | References ExpenseTypes.ExpenseTypeId |
| TenantExpenseCycleId | int | FK, NOT NULL | References ExpenseCycles.ExpenseCycleId |
| TenantExpenseStartDate | datetime2 | NOT NULL | When the expense starts |
| TenantExpenseEndDate | datetime2 | NULL | When the expense ends (e.g., tenant moves out) - null means ongoing |
| TenantExpenseAmount | decimal(18,2) | NOT NULL, > 0 | Amount of expense per cycle |
| Comments | nvarchar(500) | NULL | Additional notes |

**Relationships:**
- FK to Tenants (TenantId)
- FK to ExpenseTypes (TenantExpenseTypeId)
- FK to ExpenseCycles (TenantExpenseCycleId)
- One TenantExpense can have many PaidExpenses (1:N)

---

### 8. **dbo.PaidExpenses**
Stores payment records for tenant expenses.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| PaidExpenseId | int | PK, IDENTITY(1,1) | Primary Key |
| TenantId | int | FK, NOT NULL | References Tenants.TenantId |
| ExpenseTypeId | int | FK, NOT NULL | References ExpenseTypes.ExpenseTypeId |
| TenantExpenseId | int | FK, NULL | References TenantExpenses.TenantExpenseId - Links to specific recurring expense |
| PaymentDate | datetime2 | NOT NULL | Date of payment |
| PaymentAmount | decimal(18,2) | NOT NULL, > 0 | Amount paid |
| Comments | nvarchar(500) | NULL | Additional notes |

**Relationships:**
- FK to Tenants (TenantId) - Many PaidExpenses per Tenant
- FK to ExpenseTypes (ExpenseTypeId)
- FK to TenantExpenses (TenantExpenseId) - Many PaidExpenses per TenantExpense (optional, for manual payments)

---

## Existing Tables (Reference)

### **dbo.Users**
- UserId (PK)
- MobileNumber (UK)
- EmailAddress
- UserName
- UserTypeId (FK to UserTypes)
- PreferredLanguage

### **dbo.UserTypes**
- UserTypeId (PK)
- UserTypeName

### **dbo.UserPreferences** (if exists)
- UserPreferenceId (PK)
- UserId (FK)

---

## Key Relationships Summary

```
Users (1) ──→ (N) Properties
            └─→ (N) UserPreferences

Addresses (1) ──→ (N) Properties

Properties (1) ──→ (N) Units

Units (1) ──→ (N) Tenants

Tenants (1) ──→ (N) TenantExpenses
         └─→ (N) PaidExpenses

ExpenseTypes (1) ──→ (N) TenantExpenses
ExpenseCycles (1) ──→ (N) TenantExpenses
```

---

## Migration Information

**Migration Name:** `AddPropertyManagementTables`
**Applied Date:** February 22, 2026
**Migration ID:** 20260222154258

All tables use SQL Server with:
- IDENTITY columns for auto-incrementing primary keys
- CASCADE delete for foreign key constraints
- Proper indexing on foreign key columns
- Decimal(18,2) for monetary values

---

## Notes

1. **AddressText vs Address**: The column was named `AddressText` to avoid naming conflict with the table name `Address`.
2. **ExpenseTypeName vs ExpenseType**: Similarly, the column was named `ExpenseTypeName` to avoid conflict with the table name.
3. **Decimal Precision**: All monetary columns (TenantExpenseAmount, PaymentAmount) use Decimal(18,2) for proper currency handling.
4. **Validation**: Database constraints include NOT NULL for required fields and data type validations.
5. **Cascade Delete**: Foreign key relationships use ON DELETE CASCADE to maintain referential integrity.
