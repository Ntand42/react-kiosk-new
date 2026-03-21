import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoginBackground from "../assets/LoginBackground2.png"; 
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:7270/api/Auth/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('roleId', String(data.roleId));
        localStorage.setItem('username', data.username); 
        localStorage.setItem("userId", data.userId); 


        alert('Login successful!');
        navigate('/home');
      } else {
        alert('Login failed. Check your credentials.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${LoginBackground})` }}>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        <input
          type="username"
          name="username"
          placeholder="username"
          required
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          onChange={handleChange}
        />
        <button type="submit">Login</button>
        <p className="login-link">
          Dont have an account? <Link to="/">Register</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
