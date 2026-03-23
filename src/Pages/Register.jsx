import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './Register.css';
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    roleId: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:7270/api/Users/Register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Registration successful!");
        navigate("/login");
      } else {
        const message = await response.text();
        setError(message || "Registration failed.");
      }
    } catch (err) {
      console.error("Detailed error:", err);
      setError("Something went wrong: " + err.message);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleRegister} className="register-form">
        <h2>Register</h2>
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
        <input
          type="text"
          name="userName"
          placeholder="Username"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
      <select name="roleId" onChange={handleChange} required>
           <option value="">Select Role</option>
          <option value="1">User</option>
           <option value="2">SuperUser</option>
        </select>
        <button type="submit">Register</button>
        <p className="register-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
