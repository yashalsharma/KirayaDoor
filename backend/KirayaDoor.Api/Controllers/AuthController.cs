using Microsoft.AspNetCore.Mvc;
using KirayaDoor.Api.Services;

namespace KirayaDoor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IOtpService _otpService;
        private readonly IOtpCacheService _otpCacheService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserService userService,
            IOtpService otpService,
            IOtpCacheService otpCacheService,
            INotificationService notificationService,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _otpService = otpService;
            _otpCacheService = otpCacheService;
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            try
            {
                _logger.LogInformation($"Received OTP request for mobile {request.MobileNumber}");

                // Validate input
                if (string.IsNullOrWhiteSpace(request.MobileNumber))
                    return BadRequest(new { error = "Mobile number is required" });

                // Validate mobile number format (10 digits)
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.MobileNumber, @"^\d{10}$"))
                    return BadRequest(new { error = "Mobile number must be 10 digits" });

                // Get or create user
                var (user, isNew) = await _userService.GetOrCreateUserAsync(request.MobileNumber, request.EmailAddress);

                // Generate OTP
                var otp = _otpService.GenerateOtp();

                // Store OTP in cache with UserId
                _otpCacheService.StoreOtp(request.MobileNumber, otp, user.UserId, isNew);

                // Send OTP via notification service
                await _notificationService.SendOtpAsync(request.MobileNumber, request.EmailAddress, otp);

                _logger.LogInformation($"OTP sent for user {user.UserId} with mobile {request.MobileNumber}");

                return Ok(new
                {
                    success = true,
                    message = "OTP sent successfully",
                    userId = user.UserId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending OTP");
                return StatusCode(500, new { error = "An error occurred while sending OTP" });
            }
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.MobileNumber) || string.IsNullOrWhiteSpace(request.Otp))
                    return BadRequest(new { error = "Mobile number and OTP are required" });

                // Validate OTP
                if (!_otpCacheService.ValidateOtp(request.MobileNumber, request.Otp))
                    return BadRequest(new { error = "Invalid or expired OTP" });

                // Get UserId from cache
                var userId = _otpCacheService.GetUserId(request.MobileNumber);
                var isNew = _otpCacheService.IsNewUser(request.MobileNumber);

                // Clear OTP after successful verification
                _otpCacheService.ClearOtp(request.MobileNumber);

                _logger.LogInformation($"OTP verified for user {userId}");

                return Ok(new
                {
                    success = true,
                    message = "OTP verified successfully",
                    userId = userId,
                    isNew = isNew
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying OTP");
                return StatusCode(500, new { error = "An error occurred while verifying OTP" });
            }
        }

        [HttpPut("update-preferences")]
        public async Task<IActionResult> UpdateUserPreferences([FromBody] UpdateUserPreferencesRequest request)
        {
            try
            {
                _logger.LogInformation($"Updating preferences for user {request.UserId}");

                // Validate input
                if (request.UserId <= 0)
                    return BadRequest(new { error = "Invalid user ID" });

                if (request.UserTypeId < 0 || request.UserTypeId > 2)
                    return BadRequest(new { error = "Invalid user type" });

                if (!string.IsNullOrEmpty(request.EmailAddress) && 
                    !System.Text.RegularExpressions.Regex.IsMatch(request.EmailAddress, @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
                    return BadRequest(new { error = "Invalid email address" });

                // Update user preferences
                await _userService.UpdateUserPreferencesAsync(
                    request.UserId,
                    request.UserTypeId,
                    request.UserName,
                    request.EmailAddress,
                    request.PreferredLanguage
                );

                _logger.LogInformation($"Preferences updated for user {request.UserId}");

                return Ok(new
                {
                    success = true,
                    message = "Preferences updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user preferences");
                return StatusCode(500, new { error = "An error occurred while updating preferences" });
            }
        }
    }
}
