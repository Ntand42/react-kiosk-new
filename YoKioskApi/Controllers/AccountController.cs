using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AccountController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("Balance/{usersId:int}")]
    public async Task<IActionResult> GetBalance([FromRoute] int usersId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == usersId && u.IsActive);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        return Ok(new { balance = user.Balance });
    }

    public sealed class FundRequest
    {
        public int UsersId { get; set; }
        public decimal Amount { get; set; }
    }

    [HttpPost("Fund")]
    public async Task<IActionResult> Fund([FromBody] FundRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { message = "Amount must be greater than 0." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UsersId && u.IsActive);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.Balance += request.Amount;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Account funded successfully", balance = user.Balance });
    }

    public sealed class FundUserAccountRequest
    {
        public int UsersId { get; set; }
        public decimal Amount { get; set; }
        public string Note { get; set; } = "";
    }

    [Authorize(Roles = "2")]
    [HttpPost("FundUserAccount")]
    public async Task<IActionResult> FundUserAccount([FromBody] FundUserAccountRequest request)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { message = "Amount must be greater than 0." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UsersId && u.IsActive);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.Balance += request.Amount;
        await _db.SaveChangesAsync();
        return Ok(new { message = "User funded successfully", balance = user.Balance });
    }
}
