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

    [Authorize(Roles = "SuperUser")]
    [HttpGet("TopSellingProducts")]
    public async Task<IActionResult> GetTopSellingProducts([FromQuery] int take = 5, [FromQuery] int days = 0)
    {
        if (take < 1) take = 1;
        if (take > 25) take = 25;

        if (days < 0) days = 0;
        if (days > 365) days = 365;

        var orderItems = _db.OrderItems.AsQueryable();
        if (days > 0)
        {
            var start = DateTime.UtcNow.AddDays(-days);
            orderItems = orderItems.Join(
                _db.Orders.Where(o => o.OrderDate >= start),
                oi => oi.OrdersId,
                o => o.OrdersId,
                (oi, _) => oi
            );
        }

        var top = await orderItems
            .GroupBy(oi => oi.ProductsId)
            .Select(g => new { productsId = g.Key, soldQuantity = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.soldQuantity)
            .Take(take)
            .Join(
                _db.Products,
                x => x.productsId,
                p => p.ProductsId,
                (x, p) => new
                {
                    productsId = p.ProductsId,
                    productName = p.ProductName,
                    image = p.Image,
                    soldQuantity = x.soldQuantity
                }
            )
            .ToListAsync();

        return Ok(top);
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("ProductsByCategory")]
    public async Task<IActionResult> GetProductsByCategory([FromQuery] int days = 0)
    {
        if (days < 0) days = 0;
        if (days > 365) days = 365;

        var orderItems = _db.OrderItems.AsQueryable();
        if (days > 0)
        {
            var start = DateTime.UtcNow.AddDays(-days);
            orderItems = orderItems.Join(
                _db.Orders.Where(o => o.OrderDate >= start),
                oi => oi.OrdersId,
                o => o.OrdersId,
                (oi, _) => oi
            );
        }

        var byCategory = await orderItems
            .Join(_db.Products, oi => oi.ProductsId, p => p.ProductsId, (oi, p) => new { oi, p })
            .Join(_db.Categories, x => x.p.CategoryId, c => c.CategoryId, (x, c) => new { x.oi, x.p, c })
            .GroupBy(x => new { x.c.CategoryId, x.c.CategoryName })
            .Select(g => new
            {
                categoryId = g.Key.CategoryId,
                categoryName = g.Key.CategoryName,
                soldQuantity = g.Sum(x => x.oi.Quantity),
                totalRevenue = g.Sum(x => x.oi.UnitPrice * x.oi.Quantity)
            })
            .OrderByDescending(x => x.soldQuantity)
            .ToListAsync();

        return Ok(byCategory);
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("LowStock")]
    public async Task<IActionResult> GetLowStock([FromQuery] int threshold = 5, [FromQuery] int take = 10)
    {
        if (threshold < 0) threshold = 0;
        if (threshold > 500) threshold = 500;

        if (take < 1) take = 1;
        if (take > 50) take = 50;

        var low = await _db.Products
            .Where(p => p.Quantity <= threshold)
            .OrderBy(p => p.Quantity)
            .ThenBy(p => p.ProductName)
            .Take(take)
            .Select(p => new
            {
                productsId = p.ProductsId,
                productName = p.ProductName,
                image = p.Image,
                quantity = p.Quantity
            })
            .ToListAsync();

        return Ok(low);
    }

    [Authorize(Roles = "SuperUser")]
    [HttpGet("PeakOrderTime")]
    public async Task<IActionResult> GetPeakOrderTime([FromQuery] int days = 30)
    {
        if (days < 1) days = 1;
        if (days > 365) days = 365;

        var start = DateTime.UtcNow.AddDays(-days);

        var grouped = await _db.Orders
            .Where(o => o.OrderDate >= start)
            .GroupBy(o => o.OrderDate.Hour)
            .Select(g => new { hour = g.Key, totalOrders = g.Count() })
            .ToListAsync();

        var map = grouped.ToDictionary(x => x.hour, x => x.totalOrders);
        var result = new List<object>(24);
        for (var hour = 0; hour < 24; hour++)
        {
            result.Add(new { hour, label = $"{hour:00}:00", totalOrders = map.TryGetValue(hour, out var v) ? v : 0 });
        }

        return Ok(result);
    }
}
