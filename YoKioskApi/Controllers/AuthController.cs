using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;
using YoKioskApi.Services;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwtTokenService;
    private readonly PasswordService _passwordService;

    public AuthController(AppDbContext db, JwtTokenService jwtTokenService, PasswordService passwordService)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _passwordService = passwordService;
    }

    public sealed class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.IsActive && u.UserName.ToLower() == request.Username.ToLower()
        );

        if (user is null || !_passwordService.Verify(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid credentials." });
        }

        var token = _jwtTokenService.CreateToken(user);
        var roleName = user.RoleId == 2 ? "SuperUser" : "User";
        return Ok(new { token, role = roleName, roleId = user.RoleId, username = user.UserName, userId = user.Id });
    }
}
