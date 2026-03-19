using Microsoft.EntityFrameworkCore;
using YoKioskApi.Models;

namespace YoKioskApi.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasKey(x => x.Id);
        modelBuilder.Entity<User>().Property(x => x.Id).ValueGeneratedOnAdd();
        modelBuilder.Entity<User>().HasIndex(x => x.UserName).IsUnique();

        modelBuilder.Entity<Category>().HasKey(x => x.CategoryId);
        modelBuilder.Entity<Category>().Property(x => x.CategoryId).ValueGeneratedOnAdd();

        modelBuilder.Entity<Product>().HasKey(x => x.ProductsId);
        modelBuilder.Entity<Product>().Property(x => x.ProductsId).ValueGeneratedOnAdd();

        modelBuilder.Entity<CartItem>().HasKey(x => x.Id);
        modelBuilder.Entity<CartItem>().Property(x => x.Id).ValueGeneratedOnAdd();
        modelBuilder.Entity<CartItem>().HasIndex(x => new { x.UsersId, x.ProductsId }).IsUnique();

        modelBuilder.Entity<Order>().HasKey(x => x.OrdersId);
        modelBuilder.Entity<Order>().Property(x => x.OrdersId).ValueGeneratedOnAdd();

        modelBuilder.Entity<OrderItem>().HasKey(x => x.Id);
        modelBuilder.Entity<OrderItem>().Property(x => x.Id).ValueGeneratedOnAdd();
        modelBuilder.Entity<OrderItem>().HasIndex(x => new { x.OrdersId, x.ProductsId }).IsUnique();
    }
}
