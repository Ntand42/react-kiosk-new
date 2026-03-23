using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AnalyticsController(AppDbContext db)
    {
        _db = db;
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("Summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalProducts = await _db.Products.CountAsync();
        var totalOrders = await _db.Orders.CountAsync();
        var totalRevenue = await _db.Orders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;
        var activeUsers = await _db.Users.CountAsync(u => u.IsActive);

        return Ok(
            new
            {
                totalProducts,
                totalOrders,
                totalRevenue,
                activeUsers
            }
        );
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("OrdersByDay")]
    public async Task<IActionResult> GetOrdersByDay([FromQuery] int days = 14)
    {
        if (days < 1) days = 1;
        if (days > 90) days = 90;

        var start = DateTime.UtcNow.Date.AddDays(-(days - 1));
        var endExclusive = DateTime.UtcNow.Date.AddDays(1);

        var grouped = await _db.Orders
            .Where(o => o.OrderDate >= start && o.OrderDate < endExclusive)
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new
            {
                date = g.Key,
                totalOrders = g.Count(),
                totalRevenue = g.Sum(x => x.TotalAmount)
            })
            .ToListAsync();

        var map = grouped.ToDictionary(x => x.date, x => x);
        var result = new List<object>(days);
        for (var i = 0; i < days; i++)
        {
            var day = start.AddDays(i);
            if (map.TryGetValue(day, out var v))
            {
                result.Add(new { date = day.ToString("yyyy-MM-dd"), totalOrders = v.totalOrders, totalRevenue = v.totalRevenue });
            }
            else
            {
                result.Add(new { date = day.ToString("yyyy-MM-dd"), totalOrders = 0, totalRevenue = 0m });
            }
        }

        return Ok(result);
    }
}
