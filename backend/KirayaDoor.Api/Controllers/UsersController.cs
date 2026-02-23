using Microsoft.AspNetCore.Mvc;
using KirayaDoor.Api.Data;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace KirayaDoor.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found" });
            return Ok(user);
        }

        [HttpGet("mobile/{mobileNumber}")]
        public async Task<IActionResult> GetUserByMobile(string mobileNumber)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.MobileNumber == mobileNumber);
            if (user == null)
                return NotFound(new { error = "User not found" });
            return Ok(user);
        }
    }
}
