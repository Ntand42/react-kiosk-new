using Microsoft.AspNetCore.Identity;
using YoKioskApi.Models;

namespace YoKioskApi.Services;

public sealed class InMemoryStore
{
    private readonly PasswordHasher<User> _passwordHasher = new();
    private int _nextUserId = 1;
    private int _nextProductId = 1;
    private int _nextOrderId = 1;

    public object SyncRoot { get; } = new();
    public List<User> Users { get; } = new();
    public List<Category> Categories { get; } = new();
    public List<Product> Products { get; } = new();
    public Dictionary<int, List<CartLine>> CartsByUserId { get; } = new();
    public List<Order> Orders { get; } = new();

    public InMemoryStore()
    {
        Categories.AddRange(
            new[]
            {
                new Category { CategoryId = 1, CategoryName = "Snacks" },
                new Category { CategoryId = 2, CategoryName = "Drinks" },
                new Category { CategoryId = 3, CategoryName = "Fruits" },
                new Category { CategoryId = 4, CategoryName = "Meal" },
                new Category { CategoryId = 5, CategoryName = "Salad" }
            }
        );

        CreateUser("admin", "admin@yokiosk.local", "Admin123_", roleId: 2, balance: 1000);
        CreateUser("user", "user@yokiosk.local", "User123_", roleId: 1, balance: 250);

        Products.AddRange(
            new[]
            {
                new Product
                {
                    ProductsId = NextProductId(),
                    ProductName = "Chips",
                    Description = "Salted potato chips",
                    Price = 15.00m,
                    CategoryId = 1,
                    Quantity = 100,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow,
                    Image = "uploads/sample-chips.png"
                },
                new Product
                {
                    ProductsId = NextProductId(),
                    ProductName = "Orange Juice",
                    Description = "Fresh juice",
                    Price = 25.00m,
                    CategoryId = 2,
                    Quantity = 50,
                    IsActive = true,
                    DateCreated = DateTime.UtcNow,
                    Image = "uploads/sample-juice.png"
                }
            }
        );
    }

    public User CreateUser(string userName, string email, string password, int roleId, decimal balance)
    {
        var user = new User
        {
            Id = NextUserId(),
            UserName = userName,
            Email = email,
            RoleId = roleId,
            Balance = balance,
            IsActive = true
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        Users.Add(user);
        return user;
    }

    public bool VerifyPassword(User user, string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }

    public int NextUserId() => _nextUserId++;
    public int NextProductId() => _nextProductId++;
    public int NextOrderId() => _nextOrderId++;
}
