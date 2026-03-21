import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "./Product.css";
import './AddProduct.css';
import YoKioskLogo from '../assets/YoKioskLogo.png'; // adjust path as needed
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";



const AccountModal = ({ show, onClose, onFund, currentBalance }) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onFund(numericAmount);
      setAmount("");
    } else {
      alert("Please enter a valid amount.");
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Wallet</h2>
        <p>
          {typeof currentBalance === "number" && !isNaN(currentBalance)
            ? `R ${currentBalance.toFixed(2)}`
            : "Balance unavailable"}
        </p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <button onClick={handleSubmit} className="submit-btn">Submit</button>
        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    </div>
  );
};

const CartModal = ({ show, onClose, cartItems, onQuantityChange, onCheckout, onClearCart }) => {
  if (!show) return null;

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price || 0),
    0
  );

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Shopping Cart</h2>
        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((item, index) => (
                <li key={index} className="cart-item">
                  <img
                    src={`http://localhost:7270/${item.image}`}
                    alt={item.productName}
                    className="cart-image"
                  />
                  <div className="cart-item-details">
                    <p><strong>{item.productName}</strong></p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: R {parseFloat(item.price).toFixed(2)}</p>
                    <div className="quantity-controls">
                      <button onClick={() => onQuantityChange(item.productsId, -1)} >-</button>
                      <button onClick={() => onQuantityChange(item.productsId, 1)}>+</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <hr />
            <p><strong>Total: R {total.toFixed(2)}</strong></p>
          </>
        )}
        <button onClick={onClose} className="close-btn">Close</button>
        {cartItems.length > 0 && (
          <div className="delivery-method-buttons">
            <button onClick={() => onCheckout("pickup")} className="checkout-btn">Pickup</button>
            <button onClick={() => onCheckout("delivery")} className="checkout-btn">Delivery</button>
           <div style={{ marginTop: "10px", textAlign: "center" }}>
      <button onClick={onClearCart} className="clear-cart-btn">Clear Cart 🗑️ </button>
           </div>
 
          </div>  
        )}
      </div>
    </div>
  );
};


const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const usersId = localStorage.getItem("userId");

  const categoryImages = {
    Snacks: "/images/snacks.jpg",
    Drinks: "/images/Drinks.jpg",
    Fruits: "/images/fruits.jpg",
    Meal: "/images/meals.jpg",
    Salad: "/images/salad.jpg",
  };

  const fetchOrders = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");



  
  try {
    const res = await fetch(`http://localhost:7270/api/Order/User/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch orders");

    const data = await res.json();
    setOrders(data);
    setShowOrders(true); // show modal after fetching
  } catch (err) {
    console.error("Error fetching orders:", err);
    alert("Failed to load orders.");
  }
};


  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleFundAccount = (amount) => {
    if (!usersId) {
      alert("User not found.");
      return;
    }

    fetch("http://localhost:7270/api/Account/Fund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usersId: parseInt(usersId), amount }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fund account");
        return fetch(`http://localhost:7270/api/Account/Balance/${usersId}`);
      })
      .then((res) => res.json())
      .then((data) => {
        const parsedBalance = Number(data.balance ?? data);
        if (isNaN(parsedBalance)) throw new Error("Invalid balance received");

        setWalletBalance(parsedBalance);
        alert(`Account funded with R${amount.toFixed(2)}`);
        setShowAccountModal(false);
      })
      .catch((err) => {
        console.error("Error funding account:", err);
        alert("Failed to fund account.");
      });
  };

  const handleAddToCart = (product) => {
    const usersId = localStorage.getItem("userId");
    const quantity = 1;

    if (!usersId || isNaN(parseInt(usersId)) || !product?.productsId) {
      alert("Invalid user or product.");
      return;
    }

    if (product.quantity < quantity) {
      alert("Product not available or insufficient quantity.");
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productsId === product.productsId);
      if (existingItem) {
        return prevItems.map((item) =>
          item.productsId === product.productsId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });

    const payload = {
      usersId: parseInt(usersId),
      productsId: product.productsId,
      quantity,
    };

    fetch("http://localhost:7270/api/Cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.message || "Failed to add product to cart.");
          });
        }
        return res.json();
      })
      .then((data) => {
        setCartCount((prevCount) => prevCount + 1);
        alert(data.message || "Product added to cart!");
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert(error.message);
      });
  };
const handleQuantityChange = (productId, delta) => {
  setCartItems((prevItems) => {
    return prevItems.flatMap((item) => {
      if (item.productsId === productId) {
        const newQuantity = item.quantity + delta;

        if (newQuantity <= 0) {
          const confirmed = window.confirm(
            `Do you want to remove "${item.productName}" from the cart?`
          );
          return confirmed ? [] : [item]; // Remove if confirmed
        }

        return [{ ...item, quantity: newQuantity }];
      }

      return [item];
    });
  });
};


 const handleConfirmOrder = (method) => {
  const usersId = parseInt(localStorage.getItem("userId"));
  if (!usersId) {
    alert("User not identified.");
    return;
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price || 0),
    0
  );

  if (walletBalance < total) {
    alert("Insufficient wallet balance.");
    return;
  }

  const order = {
    usersId,
    deliveryMethod: method,
    cartItems: cartItems.map(({ productsId, quantity }) => ({
      productsId,
      quantity
    })),
  };

  console.log("Sending checkout payload:", order);

  fetch("http://localhost:7270/api/Cart/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Checkout failed.");
      return res.json();
    })
    .then(() => {
      alert("Order placed successfully!");
      setCartItems([]);
      setCartCount(0);
      setWalletBalance((prev) => prev - total);
      setShowCartModal(false);
    })
    .catch((err) => {
      console.error("Checkout error:", err);
      alert("Failed to complete order.");
    });
};


 const handleCheckout = (method) => {
  if (cartItems.length === 0) {
    alert("Cart is empty.");
    return;
  }

  if (method !== "pickup" && method !== "delivery") {
    alert("Invalid delivery method.");
    return;
  }

  handleConfirmOrder(method);
};

const clearCart = () => {
  setCartItems([]);
  setCartCount(0);

  const usersId = localStorage.getItem("userId");

  if (!usersId) {
    console.error("User ID not found.");
    return;
  }

  fetch(`http://localhost:7270/api/Cart/Clear?userId=${usersId}`, {
    method: "DELETE",
    headers: {
      Accept: "*/*",
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.text(); // <- Expecting plain text
    })
    .then((message) => {
      alert(message); // Shows "Cart cleared successfully."
    })
    .catch((err) => {
      console.error("Error clearing cart:", err);
      alert("Failed to clear cart.");
    });
};


  useEffect(() => {
    fetch("http://localhost:7270/api/Category")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:7270/api/Products/ProductCollection")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    if (usersId) {
      fetch(`http://localhost:7270/api/Account/Balance/${usersId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch balance");
          return res.json();
        })
        .then((data) => {
          const parsedBalance = Number(data.balance ?? data);
          setWalletBalance(!isNaN(parsedBalance) ? parsedBalance : 0);
        })
        .catch((err) => {
          console.error("Error fetching balance:", err);
          setWalletBalance(0);
        });
    }
  }, [usersId]);

 const filteredProducts = products
  .filter((product) => (role === "2" ? true : product.isActive))
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
        {role === "2" && (
          <>
            <button onClick={() => navigate("/addProduct")}>Product Management</button>
            <button onClick={() => navigate("/usermanagement")}>User Management</button>
          </>
        )}
        <button onClick={fetchOrders}>Orders</button>
        <button className="nav-button cart-button" onClick={() => setShowCartModal(true)}>
          🛒 Cart
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
        <button onClick={() => setShowAccountModal(true)} className="nav-button">
          Wallet (
          {typeof walletBalance === "number" && !isNaN(walletBalance)
            ? `R${walletBalance.toFixed(2)}`
            : "Balance unavailable"}
          )
        </button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav> 

{showOrders && (
  <div className="order-modal-overlay">
    <div className="order-modal">
      <h2>Order History</h2>
      <button className="order-close-button" onClick={() => setShowOrders(false)}>X</button>

      {/* Date Filter */}
      <div className="order-filter">
        <label>Filter by Date Range:</label>
        <div className="date-range">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="From Date"
            className="datepicker-input"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="To Date"
            className="datepicker-input"
          />
          <button onClick={() => { setStartDate(null); setEndDate(null); }} className="usermanagement-button">
            Clear Filter
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="order-list">
        {orders
          .filter((order) => {
            const orderDate = new Date(order.orderDate);
            if (startDate && orderDate < startDate) return false;
            if (endDate && orderDate > endDate) return false;
            return true;
          })
          .map((order) => (
            <div key={order.ordersId} className="order-entry">
              <p><strong>Order ID:</strong> {order.ordersId}</p>
              <p><strong>Total:</strong> R{order.totalAmount}</p>
              <p><strong>Method:</strong> {order.deliveryMethod}</p>
              <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  </div>
)}



      <AccountModal
        show={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onFund={handleFundAccount}
        currentBalance={walletBalance}
      />

      <CartModal
      show={showCartModal}
      onClose={() => setShowCartModal(false)}
      cartItems={cartItems}
      onQuantityChange={handleQuantityChange}
      onCheckout={handleCheckout}
      onClearCart={clearCart}
    />


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
      <div className="product-card" key={product.productId}>
        <img
          src={`http://localhost:7270/${product.image}`}
          alt={product.productName}
          className="product-image"
        />
        <h3>{product.productName}</h3>
        <p className="description">{product.description}</p>
        <p className="quantity">Quantity: {product.quantity}</p>
        <p className="inactive">
          Status: {product.isActive ? "Active" : "Inactive"}
          <p className="price">R {parseFloat(product.price).toFixed(2)}</p>
        </p>

        <div className="button-group">
          {role === "2" && product.productsId && (
            <button
              className="edit-button-small"
              onClick={() => navigate(`/edit-product/${product.productsId}`)}
            >
              ✏️ Edit
            </button>
          )}
          <button
            onClick={() => handleAddToCart(product)}
            className="add-to-cart-btn"
          >
            <span role="img" aria-label="cart">🛒</span> Add to Cart
          </button>
        </div>
      </div>
    ))}
  </div>
</div>


    </div>
  );
};

export default Home;
