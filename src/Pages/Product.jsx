/*import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Product.css";
import "./AddProduct.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  

  useEffect(() => {
    fetch("https://localhost:7271/api/Products/ProductCollection")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-container">
      <div className="product-header">
        <h2>Product Listings</h2>
        {role === "2" && (
          <div>
            <button onClick={() => navigate("/addProduct")}>Add Product</button>
            <button onClick={() => navigate("/home")} style={{ marginLeft: "10px" }}>
              Home
            </button>
          </div>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product.productId}>
            <img
              src={`https://localhost:7271/${product.image}`}
              alt={product.productName}
              className="product-image"
            />
            <h3>{product.productName}</h3>
            <p className="description">{product.description}</p>
            <p className="price">R {parseFloat(product.price).toFixed(2)}</p>
            <p className="quantity">Quantity: {product.quantity}</p>
            <p className="inactive">Status: {product.isActive ? "Active" : "Inactive"}</p>

          </div>
        ))}
      </div>
    </div>
  );
};

export default Product;*/
