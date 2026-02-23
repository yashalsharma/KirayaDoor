namespace KirayaDoor.Api.Controllers
{
    public class SendOtpRequest
    {
        public required string MobileNumber { get; set; }
        public string? EmailAddress { get; set; }
    }

    public class VerifyOtpRequest
    {
        public required string MobileNumber { get; set; }
        public required string Otp { get; set; }
    }

    public class UpdateUserPreferencesRequest
    {
        public int UserId { get; set; }
        public int UserTypeId { get; set; }
        public string? UserName { get; set; }
        public string? EmailAddress { get; set; }
        public string PreferredLanguage { get; set; } = "en";
    }
}
