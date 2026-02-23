# KirayaDoor Backend Setup Instructions

## Prerequisites
- .NET 10 SDK installed (verify with `dotnet --version`)
- SQL Server running (via Docker Compose or local SQL Server instance)

## Step 1: Install EF Core Packages

Run these commands in PowerShell from the `KirayaDoor.Api` directory:

```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Microsoft.EntityFrameworkCore.Design
```

## Step 2: Install EF Core CLI Tool (if not already installed)

```powershell
dotnet tool install --global dotnet-ef
```

If already installed, update it:
```powershell
dotnet tool update --global dotnet-ef
```

## Step 3: Configure SQL Server Connection

### Option A: Local SQL Server (Recommended for Development)

The connection string in `appsettings.json` is already configured for local SQL Server Express with Windows Authentication.

**Find your SQL Server instance name:**

1. Open **SQL Server Configuration Manager** (search in Start menu)
2. Look under **SQL Server Services** → **SQL Server (INSTANCENAME)**
3. Common instance names:
   - `SQLEXPRESS` (SQL Server Express)
   - `MSSQLSERVER` (Default instance - use `localhost` or `.` instead)
   - Custom instance name you created

**Update the connection string in `appsettings.json`:**

**For SQL Server Express (default):**
```json
"Default": "Server=localhost\\SQLEXPRESS;Database=KirayaDoor;Integrated Security=True;TrustServerCertificate=True;"
```

**For default instance:**
```json
"Default": "Server=localhost;Database=KirayaDoor;Integrated Security=True;TrustServerCertificate=True;"
```

**For SQL Server Authentication (if you prefer username/password):**
```json
"Default": "Server=localhost\\SQLEXPRESS;Database=KirayaDoor;User Id=yourusername;Password=yourpassword;TrustServerCertificate=True;"
```

**Verify SQL Server is running:**
- Open **Services** (services.msc) and check that **SQL Server (INSTANCENAME)** is running
- Or use SQL Server Management Studio (SSMS) to connect

### Option B: Docker (Alternative)

If you prefer Docker, from the `backend` directory:

```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend"
docker-compose up -d
```

This starts SQL Server on `localhost:1433` with:
- Username: `sa`
- Password: `YourStrong!Passw0rd`
- Database: `KirayaDoor` (will be created automatically)

**Note:** If using Docker, update the connection string in `appsettings.json` to:
```json
"Default": "Server=localhost,1433;Database=KirayaDoor;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
```

## Step 4: Create and Apply Database Migrations

From the `KirayaDoor.Api` directory:

```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"

dotnet ef migrations add InitialCreate
dotnet ef database update
```

This will:
- Create a `Migrations` folder with migration files
- Create the `KirayaDoor` database in SQL Server
- Create all tables (Owners, Properties, Units, Tenants) with proper relationships

## Step 5: Run the API

```powershell
cd "C:\Users\yasha\OneDrive\Desktop\KirayaDoor\backend\KirayaDoor.Api"
dotnet run
```

The API will start on:
- HTTP: `http://localhost:5248`
- HTTPS: `https://localhost:7079`

Test it by visiting: `http://localhost:5248/health`

## Database Schema

The database includes:
- **Owners** table (Id, FullName, Email, Phone, CreatedAtUtc)
- **Properties** table (Id, OwnerId, Name, Address, CreatedAtUtc) - Foreign key to Owners
- **Units** table (Id, PropertyId, UnitNumber, RentAmount, Status, CreatedAtUtc) - Foreign key to Properties
- **Tenants** table (Id, UnitId, FullName, Email, Phone, MoveInDate, CreatedAtUtc) - Foreign key to Units (one-to-one)

## Troubleshooting

### Connection String Issues
If you get connection errors, verify:
1. SQL Server is running:
   - Check **Services** (services.msc) → **SQL Server (INSTANCENAME)** is running
   - Or use SSMS to connect to your instance
2. Connection string in `appsettings.json` matches your SQL Server setup:
   - Correct instance name (e.g., `SQLEXPRESS` or default instance)
   - Correct authentication method (Windows Authentication or SQL Server Authentication)
3. For Windows Authentication: Ensure your Windows user has permissions to create databases
4. For SQL Server Authentication: Verify username/password are correct
5. If using named instance, use double backslash: `localhost\\SQLEXPRESS` (not single backslash)

### Migration Issues
If migrations fail:
- Ensure SQL Server is running and accessible
- Check that the connection string is correct
- Try deleting the `Migrations` folder and running `dotnet ef migrations add InitialCreate` again
