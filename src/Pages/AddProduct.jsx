import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const roleId = localStorage.getItem("roleId");
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState({
    productName: "",
    description: "",
    price: "",
    categoryId: "",
    quantity: "",
    dateCreated: new Date().toISOString().slice(0, 10),
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch categories if necessary
    fetch("http://localhost:7270/api/Category")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Category fetch failed", err));
  }, []);

 const handleChange = (e) => {
  const { name, value, type } = e.target;
  setProduct((prev) => ({
    ...prev,
    [name]: type === "number" ? parseFloat(value) || 0 : value,
  }));
};

 console.log("Submitting product:", product);

const handleSubmit = async (e) => {
  e.preventDefault();

if (!product.productName || !product.description || !product.price || product.price <= 0 || !product.categoryId || !product.quantity || !image) {
  setError("All fields are required and must be valid.");
  return;
}


  try {
    const formData = new FormData();
    formData.append("productName", product.productName);
    formData.append("description", product.description);
    formData.append("price", product.price);
    formData.append("quantity", product.quantity);
    formData.append("categoryId", product.categoryId);
    formData.append("dateCreated", product.dateCreated);
    formData.append("image", image);
   
    const response = await fetch("http://localhost:7270/api/Products/CreateProduct", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create product.");
    }

    const data = await response.json();
    alert(data.message || "Product created successfully!");
    navigate("/home");

  } catch (err) {
    console.error("Submission error:", err);
    setError(err.message || "An error occurred.");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("roleId");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (roleId !== "2") {
    return <p className="text-center text-red-600">Unauthorized access</p>;
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">Add New Product</h1>
        <div className="nav-links">
          <button onClick={() => navigate("/home")}>Back to Home</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Existing Add Product Form */}
      <div className="add-product-container">
        <form onSubmit={handleSubmit} className="add-product-form">
          <h2>Add New Product</h2>
          {error && <p className="error-message">{error}</p>}

          <input
           type="text"
           name="productName"
          placeholder="Product Name"
          className="w-full p-2 border rounded"
          value={product.productName}
          onChange={handleChange}
         required
          />

        <textarea
        name="description"
        placeholder="Description"
        className="w-full p-2 border rounded"
        value={product.description}
        onChange={handleChange}
        required
        />

        <input
        type="number"
        name="price"
        placeholder="Price"
        step="0.01"
        className="w-full p-2 border rounded"
        value={product.price}
        onChange={handleChange}
        required
         />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            className="w-full p-2 border rounded"
             value={product.quantity}
            onChange={handleChange}
            required
          />
          <select
            name="categoryId"
            className="w-full p-2 border rounded"
            value={product.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/*"
            className="w-full"
            onChange={(e) => setImage(e.target.files[0])}
            required
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
          >
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
