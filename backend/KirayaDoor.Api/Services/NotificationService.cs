namespace KirayaDoor.Api.Services
{
    public interface INotificationService
    {
        Task SendOtpAsync(string mobileNumber, string? emailAddress, string otp);
    }

    public class NotificationService : INotificationService
    {
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ILogger<NotificationService> logger)
        {
            _logger = logger;
        }

        public async Task SendOtpAsync(string mobileNumber, string? emailAddress, string otp)
        {
            // Log the OTP for development purposes
            _logger.LogInformation($"OTP for {mobileNumber}: {otp}");
            
            if (!string.IsNullOrEmpty(emailAddress))
            {
                _logger.LogInformation($"OTP for email {emailAddress}: {otp}");
                // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
            }

            // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
            
            await Task.CompletedTask;
        }
    }
}
