namespace KirayaDoor.Api.Services
{
    public interface IOtpService
    {
        string GenerateOtp();
    }

    public class OtpService : IOtpService
    {
        public string GenerateOtp()
        {
            // Generate a 6-digit OTP
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }
    }
}
