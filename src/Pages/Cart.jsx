/*import React, { useEffect, useState } from "react";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetch(`https://localhost:7271/api/Cart/UserCart/${userId}`)
      .then((res) => res.json())
      .then((data) => setCartItems(data))
      .catch((err) => {
        console.error("Error fetching cart items:", err);
        alert("Failed to load cart.");
      });
  }, [userId]);

  return (
    <div>
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {cartItems.map((item) => (
            <li key={item.cartId}>
              {item.cartName} - Quantity: {item.quantity} - Subtotal: R
              {item.subtotal.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Cart;*/
