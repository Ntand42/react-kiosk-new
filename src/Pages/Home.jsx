import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import "./Product.css";
import './AddProduct.css';
import YoKioskLogo from '../assets/YoKioskLogo.png'; // adjust path as needed
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const ConfettiOverlay = ({ show, runId }) => {
  const pieces = useMemo(() => {
    const mulberry32 = (seed) => {
      let t = seed >>> 0;
      return () => {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };

    const rand = mulberry32(0xC0FFEE ^ (runId * 2654435761));
    const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#00bbf9", "#f15bb5"];
    const count = 120;

    return Array.from({ length: count }, (_, i) => {
      const left = rand() * 100;
      const delay = rand() * 0.25;
      const duration = 1.8 + rand() * 1.2;
      const rotate = (rand() * 360 - 180).toFixed(2);
      const size = 6 + rand() * 8;
      const drift = (rand() * 2 - 1) * 180;
      const color = colors[Math.floor(rand() * colors.length)];
      const opacity = 0.75 + rand() * 0.25;

      return {
        key: `${runId}-${i}`,
        left: `${left.toFixed(2)}vw`,
        delay: `${delay.toFixed(3)}s`,
        duration: `${duration.toFixed(2)}s`,
        rotate: `${rotate}deg`,
        width: `${Math.max(4, size * 0.55).toFixed(2)}px`,
        height: `${size.toFixed(2)}px`,
        drift: `${drift.toFixed(2)}px`,
        backgroundColor: color,
        opacity: opacity.toFixed(2),
      };
    });
  }, [runId]);

  if (!show) return null;

  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.backgroundColor,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `translateX(0px) rotate(${p.rotate})`,
            "--confetti-drift": p.drift,
          }}
        />
      ))}
    </div>
  );
};

const formatShortDate = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const SparkBarChart = ({ points, valueKey, color, title }) => {
  const values = Array.isArray(points) ? points.map((p) => Number(p?.[valueKey] ?? 0)) : [];
  const max = Math.max(1, ...values);
  const count = values.length || 1;

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <svg className="chart-svg" viewBox={`0 0 ${count} 100`} preserveAspectRatio="none" aria-hidden="true">
        {values.map((v, i) => {
          const h = (v / max) * 88;
          const y = 96 - h;
          return <rect key={i} x={i + 0.12} y={y} width={0.76} height={h} rx={0.18} fill={color} />;
        })}
        <rect x="0" y="96" width={count} height="1" fill="rgba(0,0,0,0.08)" />
      </svg>
      <div className="chart-footer">
        <div className="chart-range">
          {points?.[0]?.date ? formatShortDate(points[0].date) : "—"} –{" "}
          {points?.[points.length - 1]?.date ? formatShortDate(points[points.length - 1].date) : "—"}
        </div>
        <div className="chart-max">Max: {max.toFixed(valueKey === "totalRevenue" ? 2 : 0)}</div>
      </div>
    </div>
  );
};

const apiImageUrl = (image) => (image ? `http://localhost:7270/${image}` : "");

const MiniBarChart = ({ title, points, valueKey, color, footerLeft }) => {
  const values = Array.isArray(points) ? points.map((p) => Number(p?.[valueKey] ?? 0)) : [];
  const max = Math.max(1, ...values);
  const count = values.length || 1;

  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      <svg className="chart-svg chart-svg-compact" viewBox={`0 0 ${count} 100`} preserveAspectRatio="none" aria-hidden="true">
        {values.map((v, i) => {
          const h = (v / max) * 88;
          const y = 96 - h;
          return <rect key={i} x={i + 0.12} y={y} width={0.76} height={h} rx={0.18} fill={color} />;
        })}
        <rect x="0" y="96" width={count} height="1" fill="rgba(0,0,0,0.08)" />
      </svg>
      <div className="chart-footer">
        <div className="chart-range">{footerLeft || "—"}</div>
        <div className="chart-max">Max: {max.toFixed(0)}</div>
      </div>
    </div>
  );
};

const PieChartCard = ({ title, rows }) => {
  const safeRows = Array.isArray(rows) ? rows.filter((r) => Number(r?.value ?? 0) > 0) : [];
  const total = safeRows.reduce((sum, r) => sum + Number(r.value), 0);
  const colors = ["#1982c4", "#8ac926", "#ffca3a", "#ff595e", "#6a4c93", "#00bbf9", "#f15bb5", "#9ca3af"];

  const toXY = (angleDeg, radius) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) };
  };

  let startAngle = 0;
  const slices = safeRows.map((r, idx) => {
    const value = Number(r.value);
    const angle = total > 0 ? (value / total) * 360 : 0;
    const endAngle = startAngle + angle;
    const start = toXY(startAngle, 42);
    const end = toXY(endAngle, 42);
    const largeArc = angle > 180 ? 1 : 0;
    const d = `M 50 50 L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A 42 42 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
    const fill = colors[idx % colors.length];
    const slice = { d, fill, label: r.label, value };
    startAngle = endAngle;
    return slice;
  });

  return (
    <div className="chart-card pie-card">
      <div className="chart-title">{title}</div>
      {total <= 0 ? (
        <div className="mini-empty">No data yet</div>
      ) : (
        <div className="pie-layout">
          <svg className="pie-svg" viewBox="0 0 100 100" aria-hidden="true">
            {slices.map((s, i) => (
              <path key={i} d={s.d} fill={s.fill} />
            ))}
            <circle cx="50" cy="50" r="25" fill="#ffffff" />
          </svg>
          <div className="pie-legend">
            {slices.map((s, i) => (
              <div key={i} className="pie-legend-row">
                <span className="pie-dot" style={{ backgroundColor: s.fill }} />
                <span className="pie-name">{s.label}</span>
                <span className="pie-value">{Math.round((s.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniListCard = ({ title, rows, emptyText, valueSuffix }) => {
  const safe = Array.isArray(rows) ? rows : [];
  return (
    <div className="chart-card">
      <div className="chart-title">{title}</div>
      {safe.length === 0 ? (
        <div className="mini-empty">{emptyText}</div>
      ) : (
        <div className="mini-list">
          {safe.map((r) => (
            <div key={r.productsId ?? r.productName ?? r.label} className="mini-list-row">
              {r.image ? <img src={apiImageUrl(r.image)} alt={r.productName || r.label || "item"} className="mini-list-image" /> : null}
              <div className="mini-list-main">
                <div className="mini-list-name">{r.productName || r.label}</div>
              </div>
              <div className="mini-list-value">
                {typeof r.value === "number" ? r.value : r.soldQuantity ?? r.quantity ?? r.totalOrders ?? 0}
                {valueSuffix || ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AccountModal = ({ show, onClose, onFund, currentBalance }) => {
  const [amount, setAmount] = useState("");


  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onFund(numericAmount);
      setAmount("");
    } else {
      toast.warning("Please enter a valid amount.");
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
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsSeries, setAnalyticsSeries] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [peakOrderHours, setPeakOrderHours] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRunId, setConfettiRunId] = useState(0);
  const confettiTimeoutRef = useRef(null);
  
  const navigate = useNavigate();

  const roleId = localStorage.getItem("roleId");
  const usersId = localStorage.getItem("userId");

  const categoryImages = {
    Snacks: "/images/snacks.jpg",
    Drinks: "/images/Drinks.jpg",
    Fruits: "/images/fruits.jpg",
    Meal: "/images/meals.jpg",
    Salad: "/images/salad.jpg",
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsError("");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, byDayRes, topRes, byCategoryRes, lowStockRes, peakRes] = await Promise.all([
        fetch("http://localhost:7270/api/Analytics/Summary", { headers }),
        fetch("http://localhost:7270/api/Analytics/OrdersByDay?days=14", { headers }),
        fetch("http://localhost:7270/api/Analytics/TopSellingProducts?take=5", { headers }),
        fetch("http://localhost:7270/api/Analytics/ProductsByCategory", { headers }),
        fetch("http://localhost:7270/api/Analytics/LowStock?threshold=5&take=6", { headers }),
        fetch("http://localhost:7270/api/Analytics/PeakOrderTime?days=30", { headers }),
      ]);

      if (!summaryRes.ok || !byDayRes.ok || !topRes.ok || !byCategoryRes.ok || !lowStockRes.ok || !peakRes.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const [summary, byDay, top, byCategory, lowStock, peak] = await Promise.all([
        summaryRes.json(),
        byDayRes.json(),
        topRes.json(),
        byCategoryRes.json(),
        lowStockRes.json(),
        peakRes.json(),
      ]);
      setAnalytics(summary);
      setAnalyticsSeries(Array.isArray(byDay) ? byDay : []);
      setTopSellingProducts(Array.isArray(top) ? top : []);
      setProductsByCategory(Array.isArray(byCategory) ? byCategory : []);
      setLowStockProducts(Array.isArray(lowStock) ? lowStock : []);
      setPeakOrderHours(Array.isArray(peak) ? peak : []);
    } catch (err) {
      setAnalytics(null);
      setAnalyticsSeries([]);
      setTopSellingProducts([]);
      setProductsByCategory([]);
      setLowStockProducts([]);
      setPeakOrderHours([]);
      setAnalyticsError(err?.message || "Failed to fetch analytics");
    }
  };

  const fetchOrders = async () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");



  
  try {
    const isSuperUser = roleId === "2";
    const url = isSuperUser
      ? "http://localhost:7270/api/Order/All"
      : `http://localhost:7270/api/Order/User/${userId}`;

    const res = await fetch(url, {
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
    toast.error("Failed to load orders.");
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

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  const triggerConfetti = () => {
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
    }

    setConfettiRunId((v) => v + 1);
    setShowConfetti(true);
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
    }, 2500);
  };

  const handleFundAccount = (amount) => {
    if (!usersId) {
      toast.error("User not found.");
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
        toast.success(`Account funded with R${amount.toFixed(2)}`);
        setShowAccountModal(false);
      })
      .catch((err) => {
        console.error("Error funding account:", err);
        toast.error("Failed to fund account.");
      });
  };

  const handleAddToCart = (product) => {
    const usersId = localStorage.getItem("userId");
    const quantity = 1;

    if (!usersId || isNaN(parseInt(usersId)) || !product?.productsId) {
      toast.error("Invalid user or product.");
      return;
    }

    if (product.quantity < quantity) {
      toast.warning("Product not available or insufficient quantity.");
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
        toast.success(data.message || "Product added to cart!");
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        toast.error(error.message || "Failed to add product to cart.");
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
    toast.error("User not identified.");
    return;
  }

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.price || 0),
    0
  );

  if (walletBalance < total) {
    toast.error("Insufficient wallet balance.");
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
      triggerConfetti();
      toast.success("Order placed successfully!");
      setCartItems([]);
      setCartCount(0);
      setWalletBalance((prev) => prev - total);
      setShowCartModal(false);
    })
    .catch((err) => {
      console.error("Checkout error:", err);
      toast.error("Failed to complete order.");
    });
};


 const handleCheckout = (method) => {
  if (cartItems.length === 0) {
    toast.info("Cart is empty.");
    return;
  }

  if (method !== "pickup" && method !== "delivery") {
    toast.error("Invalid delivery method.");
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
      toast.success(message || "Cart cleared successfully.");
    })
    .catch((err) => {
      console.error("Error clearing cart:", err);
      toast.error("Failed to clear cart.");
    });
};


  useEffect(() => {
    fetch("http://localhost:7270/api/Category")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    if (roleId === "2") return;

    fetch("http://localhost:7270/api/Products/ProductCollection")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error fetching products:", err));
  }, [roleId]);

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

  useEffect(() => {
    if (roleId !== "2") return;
    fetchAnalytics();
  }, [roleId]);

 const filteredProducts = products
  .filter((product) =>
    roleId === "2" ? true : product.isActive && (product.quantity ?? 0) > 0
  )
  .filter((product) =>
    selectedCategoryId ? product.categoryId === selectedCategoryId : true
  )
  .filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );


    

  return (
  <div className="home-container">
    <ConfettiOverlay show={showConfetti} runId={confettiRunId} />
    <nav className="navbar">
      <img src={YoKioskLogo} alt="YoKiosk Logo" className="logo-image" />
      <div className="nav-links">
        {roleId === "2" && (
          <>
            <button onClick={() => navigate("/addProduct")}>Product Management</button>
            <button onClick={() => navigate("/check-products")}>Menu</button>
            <button onClick={fetchOrders}>Order Management</button>
            <button onClick={() => navigate("/usermanagement")}>User Management</button>
          </>
        )}
        <button className="nav-button cart-button" onClick={() => setShowCartModal(true)}>
          🛒 Cart
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
        <button onClick={fetchOrders}>Orders</button>
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
              {roleId === "2" && (
                <p><strong>User:</strong> {order.userName ?? order.usersId}</p>
              )}
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


      {roleId === "2" ? (
        <div className="dashboard-section">
          <div className="dashboard-header">
            <h2>Dashboard</h2>
            <button onClick={fetchAnalytics} className="dashboard-refresh">
              Refresh
            </button>
          </div>

          {analyticsError && <p className="dashboard-error">{analyticsError}</p>}

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="dashboard-label">Total products</div>
              <div className="dashboard-value">
                {analytics ? analytics.totalProducts : "—"}
              </div>
            </div>
            <div className="dashboard-card">
              <div className="dashboard-label">Total orders</div>
              <div className="dashboard-value">
                {analytics ? analytics.totalOrders : "—"}
              </div>
            </div>
            <div className="dashboard-card">
              <div className="dashboard-label">Total revenue</div>
              <div className="dashboard-value">
                {analytics
                  ? `R ${Number(analytics.totalRevenue || 0).toFixed(2)}`
                  : "—"}
              </div>
            </div>
            <div className="dashboard-card">
              <div className="dashboard-label">Active users</div>
              <div className="dashboard-value">
                {analytics ? analytics.activeUsers : "—"}
              </div>
            </div>
          </div>

          <div className="dashboard-charts">
            <SparkBarChart
              points={analyticsSeries}
              valueKey="totalOrders"
              color="#1982c4"
              title="Orders (last 14 days)"
            />
            <SparkBarChart
              points={analyticsSeries}
              valueKey="totalRevenue"
              color="#8ac926"
              title="Revenue (last 14 days)"
            />
          </div>

          <div className="dashboard-widgets">
            <MiniListCard
              title="Top selling products"
              rows={topSellingProducts.map((p) => ({ ...p, value: Number(p.soldQuantity ?? 0) }))}
              emptyText="No sales yet"
            />
            <PieChartCard
              title="Products by category"
              rows={productsByCategory.map((c) => ({ label: c.categoryName, value: Number(c.soldQuantity ?? 0) }))}
            />
            <MiniListCard
              title="Low stock"
              rows={lowStockProducts.map((p) => ({ ...p, value: Number(p.quantity ?? 0) }))}
              emptyText="No low stock items"
              valueSuffix=" left"
            />
            <MiniBarChart
              title="Peak order time"
              points={peakOrderHours}
              valueKey="totalOrders"
              color="#ff595e"
              footerLeft="Last 30 days"
            />
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}


    </div>
  );
};

export default Home;
