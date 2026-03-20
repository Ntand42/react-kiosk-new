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

    public sealed class CreateProductForm
    {
        public string ProductName { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public int CategoryId { get; set; }
        public DateTime? DateCreated { get; set; }
        public bool? IsActive { get; set; }
        public IFormFile? Image { get; set; }
    }

    public sealed class UpdateProductForm
    {
        public string? ProductName { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? Quantity { get; set; }
        public int? CategoryId { get; set; }
        public DateTime? DateCreated { get; set; }
        public bool? IsActive { get; set; }
        public IFormFile? Image { get; set; }
    }

    public ProductsController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] bool includeInactive = false)
    {
        var query = _db.Products.AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        var products = await query.OrderByDescending(p => p.DateCreated).ToListAsync();
        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct([FromRoute] int id)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("ProductCollection")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> ProductCollection()
    {
        return await GetProducts(includeInactive: true);
    }

    [HttpGet("SearchProduct")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> SearchProduct([FromQuery] int id)
    {
        return await GetProduct(id);
    }

    [Authorize(Roles = "2")]
    [HttpPost("CreateProduct")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> CreateProduct()
    {
        var form = await Request.ReadFormAsync();
        return await CreateFromForm(form);
    }

    [Authorize(Roles = "2")]
    [HttpPost]
    [RequestSizeLimit(25_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateProductForm request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductName) || string.IsNullOrWhiteSpace(request.Description))
        {
            return new ContentResult
            {
                Content = "Product name and description are required.",
                ContentType = "text/plain",
                StatusCode = 400
            };
        }

        if (request.Price <= 0)
        {
            return new ContentResult { Content = "Invalid price.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (request.Quantity < 0)
        {
            return new ContentResult { Content = "Invalid quantity.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (request.CategoryId <= 0)
        {
            return new ContentResult { Content = "Invalid category.", ContentType = "text/plain", StatusCode = 400 };
        }

        var categoryExists = await _db.Categories.AnyAsync(c => c.CategoryId == request.CategoryId);
        if (!categoryExists)
        {
            return new ContentResult { Content = "Category not found.", ContentType = "text/plain", StatusCode = 400 };
        }

        if (request.Image is null || request.Image.Length == 0)
        {
            return new ContentResult { Content = "Image is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        var imagePath = await SaveUpload(request.Image);
        var created = new Product
        {
            ProductName = request.ProductName,
            Description = request.Description,
            Price = request.Price,
            Quantity = request.Quantity,
            CategoryId = request.CategoryId,
            DateCreated = request.DateCreated?.ToUniversalTime() ?? DateTime.UtcNow,
            IsActive = request.IsActive ?? true,
            Image = imagePath
        };

        _db.Products.Add(created);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Product created successfully!", product = created });
    }

    [Authorize(Roles = "2")]
    [HttpPut("UpdateProduct")]
    [ApiExplorerSettings(IgnoreApi = true)]
    [RequestSizeLimit(25_000_000)]
    public async Task<IActionResult> UpdateProduct([FromQuery] int id)
    {
        var form = await Request.ReadFormAsync();
        return await UpdateFromForm(id, form);
    }

    [Authorize(Roles = "2")]
    [HttpPut("{id:int}")]
    [RequestSizeLimit(25_000_000)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update([FromRoute] int id, [FromForm] UpdateProductForm request)
    {
        var existing = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == id);
        if (existing is null)
        {
            return NotFound("Product not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.ProductName))
        {
            existing.ProductName = request.ProductName;
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            existing.Description = request.Description;
        }

        if (request.Price is > 0)
        {
            existing.Price = request.Price.Value;
        }

        if (request.Quantity is >= 0)
        {
            existing.Quantity = request.Quantity.Value;
        }

        if (request.CategoryId is > 0)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.CategoryId == request.CategoryId.Value);
            if (!categoryExists)
            {
                return new ContentResult { Content = "Category not found.", ContentType = "text/plain", StatusCode = 400 };
            }

            existing.CategoryId = request.CategoryId.Value;
        }

        if (request.IsActive.HasValue)
        {
            existing.IsActive = request.IsActive.Value;
        }

        if (request.DateCreated.HasValue)
        {
            existing.DateCreated = request.DateCreated.Value.ToUniversalTime();
        }

        if (request.Image is not null && request.Image.Length > 0)
        {
            existing.Image = await SaveUpload(request.Image);
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Product updated successfully!", product = existing });
    }

    [Authorize(Roles = "2")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        return await SoftDeleteProduct(id);
    }

    [Authorize(Roles = "2")]
    [HttpDelete("DeleteProduct")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> DeleteProduct([FromQuery] int id)
    {
        return await SoftDeleteProduct(id);
    }

    private async Task<IActionResult> CreateFromForm(IFormCollection form)
    {
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

        if (!int.TryParse(categoryIdStr, out var categoryId) || categoryId <= 0)
        {
            return new ContentResult { Content = "Invalid category.", ContentType = "text/plain", StatusCode = 400 };
        }

        var categoryExists = await _db.Categories.AnyAsync(c => c.CategoryId == categoryId);
        if (!categoryExists)
        {
            return new ContentResult { Content = "Category not found.", ContentType = "text/plain", StatusCode = 400 };
        }

        DateTime dateCreated = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(dateCreatedStr) && DateTime.TryParse(dateCreatedStr, out var parsedDate))
        {
            dateCreated = parsedDate.ToUniversalTime();
        }

        string? imagePath = null;
        var imageFile = form.Files.GetFile("image");
        if (imageFile is not null && imageFile.Length > 0)
        {
            imagePath = await SaveUpload(imageFile);
        }
        else
        {
            var imageStr = form["image"].ToString();
            if (!string.IsNullOrWhiteSpace(imageStr))
            {
                imagePath = imageStr;
            }
        }

        if (string.IsNullOrWhiteSpace(imagePath))
        {
            return new ContentResult { Content = "Image is required.", ContentType = "text/plain", StatusCode = 400 };
        }

        var isActive = true;
        if (bool.TryParse(form["isActive"].ToString(), out var parsedIsActive))
        {
            isActive = parsedIsActive;
        }

        var created = new Product
        {
            ProductName = productName,
            Description = description,
            Price = price,
            Quantity = quantity,
            CategoryId = categoryId,
            DateCreated = dateCreated,
            IsActive = isActive,
            Image = imagePath
        };

        _db.Products.Add(created);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Product created successfully!", product = created });
    }

    private async Task<IActionResult> UpdateFromForm(int id, IFormCollection form)
    {
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

        if (int.TryParse(form["categoryId"].ToString(), out var categoryId) && categoryId > 0)
        {
            var categoryExists = await _db.Categories.AnyAsync(c => c.CategoryId == categoryId);
            if (!categoryExists)
            {
                return new ContentResult { Content = "Category not found.", ContentType = "text/plain", StatusCode = 400 };
            }

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

        string? uploadedImagePath = null;
        var imageFile = form.Files.GetFile("image");
        if (imageFile is not null && imageFile.Length > 0)
        {
            uploadedImagePath = await SaveUpload(imageFile);
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

    private async Task<IActionResult> SoftDeleteProduct(int id)
    {
        var existing = await _db.Products.FirstOrDefaultAsync(p => p.ProductsId == id);
        if (existing is null)
        {
            return NotFound(new { message = "Product not found." });
        }

        existing.IsActive = false;

        var cartItems = await _db.CartItems.Where(c => c.ProductsId == id).ToListAsync();
        if (cartItems.Count > 0)
        {
            _db.CartItems.RemoveRange(cartItems);
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Product deleted successfully", product = existing });
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
