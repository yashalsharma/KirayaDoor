# Clean Database Instructions

## Current Status
All entity models, screens, and API endpoints have been removed. The project is now a clean template ready for fresh development.

## Steps to Clean Database

### Option 1: Drop and Recreate Empty Database (Recommended)

**If using PowerShell:**
```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove existing migrations
Remove-Item -Recurse -Force .\Migrations -ErrorAction SilentlyContinue

# Drop the database
dotnet ef database drop --force

# Create a fresh empty migration
dotnet ef migrations add InitialEmpty

# Create empty database (no tables will be created since there are no DbSets)
dotnet ef database update
```

**If using Command Prompt (cmd.exe):**
```cmd
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

# Remove existing migrations
rmdir /s /q .\Migrations

# Drop the database
dotnet ef database drop --force

# Create a fresh empty migration
dotnet ef migrations add InitialEmpty

# Create empty database (no tables will be created since there are no DbSets)
dotnet ef database update
```

### Option 2: Manual SQL Script

If you prefer to manually clean the database:

```sql
USE KirayaDoor;

-- Drop all existing tables
DROP TABLE IF EXISTS Tenants;
DROP TABLE IF EXISTS Units;
DROP TABLE IF EXISTS Properties;
DROP TABLE IF EXISTS Owners;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS __EFMigrationsHistory;
```

After running SQL, update migrations:

**PowerShell:**
```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"
Remove-Item -Recurse -Force .\Migrations -ErrorAction SilentlyContinue
dotnet ef migrations add InitialEmpty --force
```

**Command Prompt:**
```cmd
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"
rmdir /s /q .\Migrations
dotnet ef migrations add InitialEmpty --force
```

## Verify Empty Database

After cleaning, verify the database is empty:

```sql
USE KirayaDoor;

-- List all tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- Should only show __EFMigrationsHistory (EF Core's migration tracking table)
```

## Next Steps

Once the database is clean:
1. When you're ready to add tables, create entity classes in `Data/Entities/`
2. Add DbSets to `ApplicationDbContext`
3. Create a new migration: `dotnet ef migrations add AddYourTables`
4. Apply migration: `dotnet ef database update`
