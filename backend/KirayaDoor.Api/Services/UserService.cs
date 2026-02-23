using KirayaDoor.Api.Data;
using KirayaDoor.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace KirayaDoor.Api.Services
{
    public interface IUserService
    {
        Task<(User, bool)> GetOrCreateUserAsync(string mobileNumber, string? emailAddress);
        Task UpdateUserPreferencesAsync(int userId, int userTypeId, string? userName, string? emailAddress, string preferredLanguage);
    }

    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(ApplicationDbContext context, ILogger<UserService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<(User, bool)> GetOrCreateUserAsync(string mobileNumber, string? emailAddress)
        {
            // Check if user exists with this mobile number
            var user = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);

            if (user != null)
            {
                _logger.LogInformation($"User found with mobile number: {mobileNumber}");
                
                // Update email if provided and not already set
                if (!string.IsNullOrEmpty(emailAddress) && 
                    (string.IsNullOrEmpty(user.EmailAddress) || user.EmailAddress != emailAddress))
                {
                    user.EmailAddress = emailAddress;
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                }

                return (user, false);
            }

            // Create new user
            user = new User
            {
                MobileNumber = mobileNumber,
                EmailAddress = emailAddress
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"New user created with mobile number: {mobileNumber}");
            return (user, true);
        }

        public async Task UpdateUserPreferencesAsync(int userId, int userTypeId, string? userName, string? emailAddress, string preferredLanguage)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                _logger.LogWarning($"User not found with ID: {userId}");
                throw new InvalidOperationException("User not found");
            }

            user.UserTypeId = userTypeId;
            user.PreferredLanguage = preferredLanguage;

            if (!string.IsNullOrEmpty(userName))
            {
                user.UserName = userName;
            }

            if (!string.IsNullOrEmpty(emailAddress))
            {
                user.EmailAddress = emailAddress;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User preferences updated for user {userId}");
        }
    }
}
