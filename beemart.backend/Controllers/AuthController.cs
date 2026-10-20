using beemart.api.Data;
using beemart.api.Request;
using beemart.api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace beemart.api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly BeeMartDbContext _context;

        public AuthController(BeeMartDbContext context)
        {
            _context = context;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) ||
                string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Password) ||
                string.IsNullOrWhiteSpace(dto.RePassword) ||
                string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest(new { message = "Semua field wajib diisi" });
            }

            if (dto.Password != dto.RePassword)
            {
                return BadRequest(new { message = "Password dan Re-Password tidak cocok" });
            }

            var exists = await _context.MsUsers.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
            if (exists)
            {
                return BadRequest(new { message = "username has already exists" }); 
            }
            string newIdUser;
            do
            {
                newIdUser = Random.Shared.Next(10000, 99999).ToString();
            } while (await _context.MsUsers.AnyAsync(u => u.IdUser == newIdUser));

            var user = new MsUser
            {
                IdUser = newIdUser,
                Username = dto.Username,
                FullName = dto.FullName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = dto.Role,
                Stsrc = true,
                Datein = DateTime.Now,
                Userin = "SYSTEM"
            };

            _context.MsUsers.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registrasi berhasil", userId = user.IdUser });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) ||
                string.IsNullOrWhiteSpace(dto.Password) ||
                string.IsNullOrWhiteSpace(dto.Role))
            {
                return BadRequest(new { message = "Invalid login" });
            }

            var user = await _context.MsUsers.FirstOrDefaultAsync(u =>
                u.Username.ToLower() == dto.Username.ToLower() &&
                u.Role.ToLower() == dto.Role.ToLower() &&
                u.Stsrc == true);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Invalid login" });
            }

            return Ok(new UserResponse
            {
                IdUser = user.IdUser,
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role
            });
        }
    }
}