using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;
using YoKioskApi.Models;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartController : ControllerBase
{
    private readonly AppDbContext _db;

    public CartController(AppDbContext db)
    {
        _db = db;
    }

    public sealed class AddToCartRequest
    {
        public int UsersId { get; set; }
        public int ProductsId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add([FromBody] AddToCartRequest request)
    {
        if (request.UsersId <= 0 || request.ProductsId <= 0 || request.Quantity <= 0)
        {
            return BadRequest(new { message = "Invalid cart request." });
        }

        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UsersId && u.IsActive);
        if (!userExists)
        {
            return NotFound(new { message = "User not found." });
        }

        var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == request.ProductsId);
        if (product is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        if (!product.IsActive)
        {
            return BadRequest(new { message = "Product is inactive." });
        }

        if (product.Quantity < request.Quantity)
        {
            return BadRequest(new { message = "Insufficient stock for this product." });
        }

        var existing = await _db.CartItems.FirstOrDefaultAsync(c =>
            c.UsersId == request.UsersId && c.ProductsId == request.ProductsId
        );

        if (existing is null)
        {
            _db.CartItems.Add(
                new CartItem
                {
                    UsersId = request.UsersId,
                    ProductsId = request.ProductsId,
                    Quantity = request.Quantity
                }
            );
        }
        else
        {
            existing.Quantity += request.Quantity;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Product added to cart!" });
    }

    [HttpGet("UserCart/{userId:int}")]
    public async Task<IActionResult> UserCart([FromRoute] int userId)
    {
        var items = await _db.CartItems
            .Where(c => c.UsersId == userId)
            .Join(
                _db.Products,
                c => c.ProductsId,
                p => p.ProductsId,
                (c, p) => new
                {
                    cartId = $"{c.UsersId}-{c.ProductsId}",
                    cartName = p.ProductName,
                    quantity = c.Quantity,
                    subtotal = p.Price * c.Quantity
                }
            )
            .ToListAsync();

        return Ok(items);
    }

    [HttpDelete("Clear")]
    public async Task<IActionResult> Clear([FromQuery] int userId)
    {
        if (userId <= 0)
        {
            return new ContentResult { Content = "User ID is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        var toRemove = await _db.CartItems.Where(c => c.UsersId == userId).ToListAsync();
        if (toRemove.Count > 0)
        {
            _db.CartItems.RemoveRange(toRemove);
            await _db.SaveChangesAsync();
        }

        return new ContentResult { Content = "Cart cleared successfully.", ContentType = "text/plain", StatusCode = 200 };
    }

    public sealed class CheckoutRequest
    {
        public int UsersId { get; set; }
        public string DeliveryMethod { get; set; } = "";
        public List<CartLine> CartItems { get; set; } = new();
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (request.UsersId <= 0)
        {
            return BadRequest(new { message = "User not identified." });
        }

        if (request.DeliveryMethod is not ("pickup" or "delivery"))
        {
            return BadRequest(new { message = "Invalid delivery method." });
        }

        if (request.CartItems.Count == 0)
        {
            return BadRequest(new { message = "Cart is empty." });
        }

        await using var tx = await _db.Database.BeginTransactionAsync();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UsersId && u.IsActive);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var productIds = request.CartItems.Select(i => i.ProductsId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.ProductsId)).ToListAsync();

        decimal total = 0;
        foreach (var item in request.CartItems)
        {
            var product = products.FirstOrDefault(p => p.ProductsId == item.ProductsId);
            if (product is null)
            {
                return BadRequest(new { message = $"Product not found: {item.ProductsId}" });
            }

            if (!product.IsActive)
            {
                return BadRequest(new { message = $"Product inactive: {product.ProductName}" });
            }

            if (item.Quantity <= 0)
            {
                return BadRequest(new { message = "Invalid quantity." });
            }

            if (product.Quantity < item.Quantity)
            {
                return BadRequest(new { message = $"Insufficient stock for {product.ProductName}." });
            }

            total += product.Price * item.Quantity;
        }

        if (user.Balance < total)
        {
            return BadRequest(new { message = "Insufficient wallet balance." });
        }

        user.Balance -= total;

        foreach (var item in request.CartItems)
        {
            var product = products.First(p => p.ProductsId == item.ProductsId);
            product.Quantity -= item.Quantity;
            if (product.Quantity <= 0)
            {
                product.Quantity = 0;
                product.IsActive = false;
            }
        }

        var order = new Order
        {
            UsersId = request.UsersId,
            TotalAmount = total,
            DeliveryMethod = request.DeliveryMethod,
            OrderDate = DateTime.UtcNow
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var orderItems = request.CartItems.Select(i =>
        {
            var product = products.First(p => p.ProductsId == i.ProductsId);
            return new OrderItem
            {
                OrdersId = order.OrdersId,
                ProductsId = i.ProductsId,
                Quantity = i.Quantity,
                UnitPrice = product.Price
            };
        });
        _db.OrderItems.AddRange(orderItems);

        var cartRows = await _db.CartItems.Where(c => c.UsersId == request.UsersId).ToListAsync();
        if (cartRows.Count > 0)
        {
            _db.CartItems.RemoveRange(cartRows);
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return Ok(new { message = "Order placed successfully!", orderId = order.OrdersId, totalAmount = order.TotalAmount });
    }
}
