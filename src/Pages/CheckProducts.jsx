import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "./Product.css";
import "./AddProduct.css";
import YoKioskLogo from "../assets/YoKioskLogo.png";

const CheckProducts = () => {
  const navigate = useNavigate();
  const roleId = localStorage.getItem("roleId");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const categoryImages = {
    Snacks: "/images/snacks.jpg",
    Drinks: "/images/Drinks.jpg",
    Fruits: "/images/fruits.jpg",
    Meal: "/images/meals.jpg",
    Salad: "/images/salad.jpg",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("roleId");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  useEffect(() => {
    if (roleId !== "2") return;

    fetch("http://localhost:7270/api/Category")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});

    fetch("http://localhost:7270/api/Products/ProductCollection")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => {});
  }, [roleId]);

  if (roleId !== "2") {
    return <p className="text-center text-red-600">Unauthorized access</p>;
  }

  const filteredProducts = products
    .filter((product) =>
      selectedCategoryId ? product.categoryId === selectedCategoryId : true
    )
    .filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="home-container">
      <nav className="navbar">
        <img src={YoKioskLogo} alt="YoKiosk Logo" className="logo-image" />
        <div className="nav-links">
          <button onClick={() => navigate("/home")}>Dashboard</button>
          <button onClick={() => navigate("/addProduct")}>Product Management</button>
          <button onClick={() => navigate("/check-products")}>Menu</button>
          <button onClick={() => navigate("/usermanagement")}>User Management</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="category-section">
        <h2 className="section-title"> Ｃａｔｅｇｏｒｙ Ｐｒｏｄｕｃｔｓ </h2>
        <div className="category-buttons">
          {categories.map((category) => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategoryId(category.categoryId)}
              className={`category-button ${selectedCategoryId === category.categoryId ? "active" : ""}`}
            >
              <img
                src={categoryImages[category.categoryName]}
                alt={category.categoryName}
                className="category-icon"
              />
              {category.categoryName}
            </button>
          ))}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`category-button ${selectedCategoryId === null ? "active" : ""}`}
          >
            <img src="/images/All.jpg" alt="All" className="category-icon" />
            All
          </button>
          <input
            type="text"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
        </div>
      </div>

      <div className="product-section">
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div
              className="product-card"
              key={product.productsId ?? product.productId}
            >
              <img
                src={`http://localhost:7270/${product.image}`}
                alt={product.productName}
                className="product-image"
              />
              <h3>{product.productName}</h3>
              <p className="description">{product.description}</p>
              <p className="quantity">Quantity: {product.quantity}</p>
              <p className="inactive">
                Status:{" "}
                {product.isActive && (product.quantity ?? 0) > 0
                  ? "Active"
                  : "InActive"}
                <p className="price">R {parseFloat(product.price).toFixed(2)}</p>
              </p>

              <div className="button-group">
                {product.productsId && (
                  <button
                    className="edit-button-small"
                    onClick={() => navigate(`/edit-product/${product.productsId}`)}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckProducts;
