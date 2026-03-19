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

    [Authorize]
    [HttpGet("User/{userId:int}")]
    public async Task<IActionResult> GetUserOrders([FromRoute] int userId)
    {
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
