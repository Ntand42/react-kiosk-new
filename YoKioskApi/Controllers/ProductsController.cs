using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YoKioskApi.Data;
using YoKioskApi.Models;

namespace YoKioskApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public ProductsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("ProductCollection")]
    public async Task<IActionResult> ProductCollection()
    {
        var products = await _db.Products.OrderByDescending(p => p.DateCreated).ToListAsync();
        return Ok(products);
    }

    [HttpGet("SearchProduct")]
    public async Task<IActionResult> SearchProduct([FromQuery] int id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == id);
        return product is null ? NotFound() : Ok(product);
    }

    [Authorize(Roles = "2")]
    [HttpPost("CreateProduct")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> CreateProduct()
    {
        var form = await Request.ReadFormAsync();

        var productName = form["productName"].ToString();
        var description = form["description"].ToString();
        var priceStr = form["price"].ToString();
        var quantityStr = form["quantity"].ToString();
        var categoryIdStr = form["categoryId"].ToString();
        var dateCreatedStr = form["dateCreated"].ToString();

        if (string.IsNullOrWhiteSpace(productName) || string.IsNullOrWhiteSpace(description))
        {
            return new ContentResult
            {
                Content = "Product name and description are required.",
                ContentType = "text/plain",
                StatusCode = 400
            };
        }

        if (!decimal.TryParse(priceStr, out var price) || price <= 0)
        {
            return new ContentResult { Content = "Invalid price.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (!int.TryParse(quantityStr, out var quantity) || quantity < 0)
        {
            return new ContentResult { Content = "Invalid quantity.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (!int.TryParse(categoryIdStr, out var categoryId))
        {
            return new ContentResult { Content = "Invalid category.", ContentType = "text/plain", StatusCode = 400 };
        }

        DateTime dateCreated = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dateCreatedStr) && DateTime.TryParse(dateCreatedStr, out var parsedDate))
        {
            dateCreated = parsedDate.ToUniversalTime();
        }

        var imageFile = form.Files.GetFile("image");
        if (imageFile is null || imageFile.Length == 0)
        {
            return new ContentResult { Content = "Image is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        var imagePath = await SaveUpload(imageFile);

        var created = new Product
        {
            ProductName = productName,
            Description = description,
            Price = price,
            Quantity = quantity,
            CategoryId = categoryId,
            DateCreated = dateCreated,
            IsActive = true,
            Image = imagePath
        };
        _db.Products.Add(created);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Product created successfully!", product = created });
    }

    [Authorize(Roles = "2")]
    [HttpPut("UpdateProduct")]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UpdateProduct([FromQuery] int id)
    {
        var form = await Request.ReadFormAsync();
        string? uploadedImagePath = null;
        var imageFile = form.Files.GetFile("image");
        if (imageFile is not null && imageFile.Length > 0)
        {
            uploadedImagePath = await SaveUpload(imageFile);
        }

        var existing = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == id);
        if (existing is null)
        {
            return NotFound("Product not found.");
        }

        existing.ProductName = form["productName"].ToString() is { Length: > 0 } pn ? pn : existing.ProductName;
        existing.Description = form["description"].ToString() is { Length: > 0 } d ? d : existing.Description;

        if (decimal.TryParse(form["price"].ToString(), out var price) && price > 0)
        {
            existing.Price = price;
        }

        if (int.TryParse(form["quantity"].ToString(), out var quantity) && quantity >= 0)
        {
            existing.Quantity = quantity;
        }

        if (int.TryParse(form["categoryId"].ToString(), out var categoryId))
        {
            existing.CategoryId = categoryId;
        }

        if (bool.TryParse(form["isActive"].ToString(), out var isActive))
        {
            existing.IsActive = isActive;
        }

        if (DateTime.TryParse(form["dateCreated"].ToString(), out var dateCreated))
        {
            existing.DateCreated = dateCreated.ToUniversalTime();
        }

        var imageStr = form["image"].ToString();
        if (!string.IsNullOrWhiteSpace(uploadedImagePath))
        {
            existing.Image = uploadedImagePath;
        }
        else if (!string.IsNullOrWhiteSpace(imageStr))
        {
            existing.Image = imageStr;
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Product updated successfully!", product = existing });
    }

    private async Task<string> SaveUpload(IFormFile file)
    {
        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var safeExt = string.IsNullOrWhiteSpace(ext) ? ".bin" : ext;
        var fileName = $"{Guid.NewGuid():N}{safeExt}";

        var absolutePath = Path.Combine(uploadsDir, fileName);
        await using var stream = System.IO.File.Create(absolutePath);
        await file.CopyToAsync(stream);

        return $"uploads/{fileName}";
    }
}
