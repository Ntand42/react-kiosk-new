
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Pages/Register.jsx";
import Login from "./Pages/Login.jsx";
import Home from "./Pages/Home.jsx";
import Product from "./Pages/Product.jsx";
import AddProduct from "./Pages/AddProduct.jsx";
import EditProduct from "./Pages/EditProduct.jsx"; 
import Cart from "./Pages/Cart.jsx";
import UserManagement from "./Pages/Usermanagement.jsx";
import CheckProducts from "./Pages/CheckProducts.jsx";
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/product" element={<Product />} />
        <Route path="/addProduct" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/usermanagement" element={<UserManagement />} />
        <Route path="/check-products" element={<CheckProducts />} />
        
  
      </Routes>
    </Router>

    
  );
}

export default App;
