using System.ComponentModel.DataAnnotations.Schema;

namespace YoKioskApi.Models;

public sealed class Category
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = "";
}

public sealed class Product
{
    public int ProductsId { get; set; }

    [NotMapped]
    public int ProductId
    {
        get => ProductsId;
        set => ProductsId = value;
    }

    public string ProductName { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public int Quantity { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;
    public string Image { get; set; } = "";
}

public sealed class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public int RoleId { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public decimal Balance { get; set; }
}

public sealed class CartLine
{
    public int ProductsId { get; set; }
    public int Quantity { get; set; }
}

public sealed class CartItem
{
    public int Id { get; set; }
    public int UsersId { get; set; }
    public int ProductsId { get; set; }
    public int Quantity { get; set; }
}

public sealed class Order
{
    public int OrdersId { get; set; }
    public int UsersId { get; set; }
    public decimal TotalAmount { get; set; }
    public string DeliveryMethod { get; set; } = "";
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
}

public sealed class OrderItem
{
    public int Id { get; set; }
    public int OrdersId { get; set; }
    public int ProductsId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
