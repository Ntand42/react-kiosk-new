using Microsoft.EntityFrameworkCore;
using YoKioskApi.Models;
using YoKioskApi.Services;

namespace YoKioskApi.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var passwordService = services.GetRequiredService<PasswordService>();

        if (db.Database.ProviderName?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
        {
            await db.Database.ExecuteSqlRawAsync(
                """
                IF OBJECT_ID(N'[dbo].[Categories]', N'U') IS NOT NULL
                BEGIN
                    SET IDENTITY_INSERT [dbo].[Categories] ON;
                    MERGE [dbo].[Categories] AS t
                    USING (VALUES
                        (1, N'Snacks'),
                        (2, N'Drinks'),
                        (3, N'Fruits'),
                        (4, N'Meal'),
                        (5, N'Salad')
                    ) AS s([CategoryId], [CategoryName])
                    ON t.[CategoryId] = s.[CategoryId]
                    WHEN MATCHED THEN UPDATE SET t.[CategoryName] = s.[CategoryName]
                    WHEN NOT MATCHED THEN INSERT ([CategoryId], [CategoryName]) VALUES (s.[CategoryId], s.[CategoryName]);
                    SET IDENTITY_INSERT [dbo].[Categories] OFF;
                END
                """
            );
        }
        else if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new[]
                {
                    new Category { CategoryId = 1, CategoryName = "Snacks" },
                    new Category { CategoryId = 2, CategoryName = "Drinks" },
                    new Category { CategoryId = 3, CategoryName = "Fruits" },
                    new Category { CategoryId = 4, CategoryName = "Meal" },
                    new Category { CategoryId = 5, CategoryName = "Salad" }
                }
            );
        }

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == "admin");
        if (adminUser is null)
        {
            adminUser = new User
            {
                UserName = "admin",
                Email = "admin@yokiosk.local",
                RoleId = 2,
                Balance = 1000,
                IsActive = true
            };
            adminUser.PasswordHash = passwordService.Hash(adminUser, "Admin123_");
            db.Users.Add(adminUser);
        }
        else
        {
            adminUser.RoleId = 2;
            adminUser.IsActive = true;
            if (string.IsNullOrWhiteSpace(adminUser.PasswordHash))
            {
                adminUser.PasswordHash = passwordService.Hash(adminUser, "Admin123_");
            }
        }

        var normalUser = await db.Users.FirstOrDefaultAsync(u => u.UserName.ToLower() == "user");
        if (normalUser is null)
        {
            normalUser = new User
            {
                UserName = "user",
                Email = "user@yokiosk.local",
                RoleId = 1,
                Balance = 250,
                IsActive = true
            };
            normalUser.PasswordHash = passwordService.Hash(normalUser, "User123_");
            db.Users.Add(normalUser);
        }

        if (!await db.Products.AnyAsync())
        {
            db.Products.AddRange(
                new[]
                {
                    new Product
                    {
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

        await db.SaveChangesAsync();
    }
}
