namespace KirayaDoor.Api.Services
{
    public interface IOtpCacheService
    {
        void StoreOtp(string mobileNumber, string otp, int userId, bool isNew);
        bool ValidateOtp(string mobileNumber, string otp);
        int? GetUserId(string mobileNumber);
        bool? IsNewUser(string mobileNumber);
        void ClearOtp(string mobileNumber);
    }

    public class OtpCacheService : IOtpCacheService
    {
        private static readonly Dictionary<string, OtpData> _otpCache = new();
        private const int OtpExpiryMinutes = 10;

        private class OtpData
        {
            public required string Otp { get; set; }
            public int UserId { get; set; }
            public bool IsNew { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        public void StoreOtp(string mobileNumber, string otp, int userId, bool isNew)
        {
            _otpCache[mobileNumber] = new OtpData
            {
                Otp = otp,
                UserId = userId,
                IsNew = isNew,
                ExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes)
            };
        }

        public bool ValidateOtp(string mobileNumber, string otp)
        {
            if (!_otpCache.ContainsKey(mobileNumber))
                return false;

            var otpData = _otpCache[mobileNumber];
            
            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                _otpCache.Remove(mobileNumber);
                return false;
            }

            return otpData.Otp == otp;
        }

        public int? GetUserId(string mobileNumber)
        {
            if (!_otpCache.ContainsKey(mobileNumber))
                return null;

            var otpData = _otpCache[mobileNumber];
            
            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                _otpCache.Remove(mobileNumber);
                return null;
            }

            return otpData.UserId;
        }

        public bool? IsNewUser(string mobileNumber)
        {
            if (!_otpCache.ContainsKey(mobileNumber))
                return null;

            var otpData = _otpCache[mobileNumber];
            
            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                _otpCache.Remove(mobileNumber);
                return null;
            }

            return otpData.IsNew;
        }

        public void ClearOtp(string mobileNumber)
        {
            _otpCache.Remove(mobileNumber);
        }
    }
}
