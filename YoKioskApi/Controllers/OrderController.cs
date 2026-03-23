using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class OrderController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrderController(AppDbContext db)
    {
        _db = db;
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet]
    public async Task<IActionResult> GetAllOrders()
    {
        var orders = await _db.Orders
            .OrderByDescending(o => o.OrderDate)
            .GroupJoin(
                _db.Users,
                o => o.UsersId,
                u => u.Id,
                (o, users) => new { o, user = users.FirstOrDefault() }
            )
            .Select(x => new
            {
                ordersId = x.o.OrdersId,
                usersId = x.o.UsersId,
                userName = x.user != null ? x.user.UserName : null,
                totalAmount = x.o.TotalAmount,
                deliveryMethod = x.o.DeliveryMethod,
                orderDate = x.o.OrderDate
            })
            .ToListAsync();

        return Ok(orders);
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("All")]
    public async Task<IActionResult> GetAllOrdersForManagement()
    {
        return await GetAllOrders();
    }

    [Authorize]
    [HttpGet("User/{userId:int}")]
    public async Task<IActionResult> GetUserOrders([FromRoute] int userId)
    {
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(currentUserIdStr, out var currentUserId))
        {
            return Unauthorized();
        }

        if (!User.IsInRole("SuperUser") && currentUserId != userId)
        {
            return Forbid();
        }

        var orders = await _db.Orders
            .Where(o => o.UsersId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                ordersId = o.OrdersId,
                usersId = o.UsersId,
                totalAmount = o.TotalAmount,
                deliveryMethod = o.DeliveryMethod,
                orderDate = o.OrderDate
            })
            .ToListAsync();

        return Ok(orders);
    }
}
