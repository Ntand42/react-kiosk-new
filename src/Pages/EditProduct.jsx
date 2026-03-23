import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './AddProduct.css';
import { toast } from "react-toastify";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const roleId = localStorage.getItem("roleId");

  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState({
    productsId: id,
    productName: "",
    description: "",
    price: "",
    categoryId: "",
    quantity: "",
    isActive: true,
    dateCreated: new Date().toISOString().slice(0, 10),
    image: "",
  });

  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  // Fetch categories and product data
  useEffect(() => {
    fetch("http://localhost:7270/api/Category")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Category fetch failed", err));

    fetch(`http://localhost:7270/api/Products/SearchProduct?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct({
          productsId: data.productsId ?? id,
          productName: data.productName ?? "",
          description: data.description ?? "",
          price: data.price ?? "",
          categoryId: data.categoryId ?? "",
          quantity: data.quantity ?? "",
          isActive: data.isActive ?? true,
          dateCreated: data.dateCreated
            ? data.dateCreated.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          image: data.image || "",
        });
      })
      .catch(err => console.error("Failed to fetch product", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prevProduct) => ({
      ...prevProduct,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product.productName || !product.price || !product.categoryId || !product.quantity) {
      setError("All fields except image are required.");
      return;
    }

    const formData = new FormData();
    Object.keys(product).forEach((key) => {
      if (key !== "image") {
        formData.append(key, product[key]);
      }
    });

    // Conditionally append the image
    if (image) {
      formData.append("image", image);
    } else {
      formData.append("image", product.image); // Keep existing image
    }

    try {
      const response = await fetch(`http://localhost:7270/api/Products/UpdateProduct?id=${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("Product updated successfully!");
        navigate("/home");
      } else {
        const msg = await response.text();
        setError(msg || "Failed to update product.");
        toast.error(msg || "Failed to update product.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred.");
      toast.error("An error occurred.");
    }
  };

  if (roleId !== "2") {
    return <p className="text-center text-red-600">Unauthorized access</p>;
  }

  if (!product.productsId) {
    return <p className="text-center">Loading product details...</p>;
  }

return (
  <div className="add-product-container">
    <form onSubmit={handleSubmit} className="add-product-form">
      <h2>Edit Product</h2>
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
      />

        {/* Show current image if no new one is selected */}
        {!image && product.image && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">Current Image:</p>
                <img
          src={`http://localhost:7270/${product.image}`}
          alt={product.productName}
          className="product-image"
        />
         
          </div>
        )}

        {/* Show preview of the new image if selected */}
        {image && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">New Image Preview:</p>
            <img
              src={URL.createObjectURL(image)}
              alt="New Product Preview"
              className="w-32 h-32 object-cover border rounded"
            />
          </div>
        )}

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isActive"
            checked={product.isActive}
            onChange={handleChange}
          />
          <span>{product.isActive ? "Marked as Active" : "Mark as Active"}</span>
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Update Product
        </button>
      </form>
    </div>
  );
};

export default EditProduct;
