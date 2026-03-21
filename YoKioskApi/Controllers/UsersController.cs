using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;
using YoKioskApi.Models;
using YoKioskApi.Services;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PasswordService _passwordService;

    public UsersController(AppDbContext db, PasswordService passwordService)
    {
        _db = db;
        _passwordService = passwordService;
    }

    public sealed class RegisterRequest
    {
        public string UserName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string RoleId { get; set; } = "";
    }

    [HttpPost("Register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return new ContentResult { Content = "Username is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return new ContentResult { Content = "Email is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return new ContentResult { Content = "Password is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (!int.TryParse(request.RoleId, out var roleId) || (roleId != 1 && roleId != 2))
        {
            return new ContentResult { Content = "Invalid role.", ContentType = "text/plain", StatusCode = 400 };
        }

        var exists = await _db.Users.AnyAsync(u => u.UserName.ToLower() == request.UserName.ToLower());
        if (exists)
        {
            return new ContentResult { Content = "Username already exists.", ContentType = "text/plain", StatusCode = 400 };
        }

        var user = new User
        {
            UserName = request.UserName,
            Email = request.Email,
            RoleId = roleId,
            Balance = 0,
            IsActive = true
        };
        user.PasswordHash = _passwordService.Hash(user, request.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Registered successfully." });
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .Where(u => u.IsActive)
            .Select(u => new
            {
                id = u.Id,
                userName = u.UserName,
                email = u.Email,
                roleId = u.RoleId,
                balance = u.Balance
            })
            .ToListAsync();

        return Ok(users);
    }

    public sealed class UpdateUserRequest
    {
        public int Id { get; set; }
        public string UserName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public int RoleId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    [Authorize(Roles = "SuperUser")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser([FromRoute] int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.UserName))
        {
            user.UserName = request.UserName;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email;
        }

        if (request.RoleId is 1 or 2)
        {
            user.RoleId = request.RoleId;
        }

        user.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { message = "User updated successfully" });
    }

    [Authorize(Roles = "SuperUser")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser([FromRoute] int id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = "User deleted successfully" });
    }
}
