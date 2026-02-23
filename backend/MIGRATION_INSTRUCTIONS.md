# Migration Instructions - Simplify Models

## Current Status
All entity models have been simplified to only contain `Id` (primary key) properties:
- Owner
- Property  
- Unit
- Tenant
- User (newly added)

## Steps to Update Database

### Option 1: Drop and Recreate Database (Recommended if no important data)

If you don't have important data in the database yet, the easiest approach is to drop and recreate:

**If using PowerShell:**
```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove existing migrations
Remove-Item -Recurse -Force .\Migrations

# Create a fresh migration
dotnet ef migrations add InitialCreate

# Drop and recreate the database
dotnet ef database drop --force
dotnet ef database update
```

**If using Command Prompt (cmd.exe):**
```cmd
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove existing migrations
rmdir /s /q .\Migrations

# Create a fresh migration
dotnet ef migrations add InitialCreate

# Drop and recreate the database
dotnet ef database drop --force
dotnet ef database update
```

### Option 2: Create Migration to Remove Columns (If you have data to preserve)

If you need to preserve existing data, create a migration that removes the columns:

```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Create a new migration
dotnet ef migrations add RemoveModelProperties

# Apply the migration
dotnet ef database update
```

**Note:** Option 2 will require manual editing of the migration file to remove all columns except `Id`. This is more complex.

### Option 3: Manual SQL Script (If migrations are problematic)

You can also manually run SQL to drop columns:

```sql
USE KirayaDoor;

-- Drop columns from Owners table (keep only Id)
ALTER TABLE Owners DROP COLUMN FullName;
ALTER TABLE Owners DROP COLUMN Email;
ALTER TABLE Owners DROP COLUMN Phone;
ALTER TABLE Owners DROP COLUMN CreatedAtUtc;

-- Drop columns from Properties table (keep only Id)
ALTER TABLE Properties DROP COLUMN OwnerId;
ALTER TABLE Properties DROP COLUMN Name;
ALTER TABLE Properties DROP COLUMN Address;
ALTER TABLE Properties DROP COLUMN CreatedAtUtc;

-- Drop columns from Units table (keep only Id)
ALTER TABLE Units DROP COLUMN PropertyId;
ALTER TABLE Units DROP COLUMN UnitNumber;
ALTER TABLE Units DROP COLUMN RentAmount;
ALTER TABLE Units DROP COLUMN Status;
ALTER TABLE Units DROP COLUMN CreatedAtUtc;

-- Drop columns from Tenants table (keep only Id)
ALTER TABLE Tenants DROP COLUMN UnitId;
ALTER TABLE Tenants DROP COLUMN FullName;
ALTER TABLE Tenants DROP COLUMN Email;
ALTER TABLE Tenants DROP COLUMN Phone;
ALTER TABLE Tenants DROP COLUMN MoveInDate;
ALTER TABLE Tenants DROP COLUMN CreatedAtUtc;

-- Create Users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY
    );
END
```

After running the SQL, update the migration snapshot:

**If using PowerShell:**
```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove old migrations
Remove-Item -Recurse -Force .\Migrations

# Create a new migration that matches current state
dotnet ef migrations add InitialCreate --force
```

**If using Command Prompt (cmd.exe):**
```cmd
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove old migrations
rmdir /s /q .\Migrations

# Create a new migration that matches current state
dotnet ef migrations add InitialCreate --force
```

## Verify

After completing any of the above options, verify the tables:

```sql
USE KirayaDoor;

-- Check table structures
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('Owners', 'Properties', 'Units', 'Tenants', 'Users')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

Each table should only have an `Id` column of type `uniqueidentifier`.
