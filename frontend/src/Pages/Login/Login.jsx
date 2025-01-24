import React, { useState } from 'react';
import '../Login.css';
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // const handleLogin = (e) => {
  //   e.preventDefault();

  //   // Retrieve all registered users from localStorage
  //   const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

  //   // Find a matching user
  //   const matchingUser = registeredUsers.find(
  //     (user) => user.username === username && user.password === password
  //   );

  //   if (matchingUser) {
  //     // Save logged-in username to localStorage
  //     localStorage.setItem('loggedInUser', username);

  //     // Redirect to the main page
  //     navigate('/MainPage');
  //   } else {
  //     setErrorMessage('Invalid username or password. Please try again.');
  //   }
  // };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        // Clear any stale data in localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("role"); 
        const response = await axios.post("http://localhost:5000/api/auth/login", {
            username,
            password,
        });

        // If login is successful, save the token and redirect
        const { token, username: loggedInUser, role } = response.data;

        // Debug log for the token
        console.log("Token received from backend:", token);

        // Handle missing token
        if (!token) {
            setErrorMessage("Token not provided by the server.");
            return;
        }

        // Save token to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("loggedInUser", loggedInUser);
        localStorage.setItem("role", role);


        if (role === "Investigator") {
          navigate("/MainPage");
      } else if (role === "CaseManager") {
          navigate("/MainPage");
      } else {
          setErrorMessage("Role not authorized");
      }
        // navigate("/MainPage");
    } catch (error) {
        if (error.response) {
            // If backend sends a specific error message
            setErrorMessage(error.response.data.message || "Login failed");
        } else {
            setErrorMessage("An unexpected error occurred.");
        }
    }
};

  return (
    <div className="background">
      <img src="/Materials/forensic.jpg" alt="Forensic Background" className="bg-image" />
      <div className="overlay">
        <div className="img-container">
          <div className="logo">
            <Link to="/LoginAdmin">
              <img src="/Materials/newpolicelogo.png" alt="Endicott Police Logo" />
            </Link>
          </div>
          <h1 className="main_heading">PIMS</h1>
        </div>
        <div className="form-container">
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <div className="forgot-pass">
              <a href="#">Forgot password?</a>
            </div>
            <div className="divider">
              <span>or</span>
            </div>
            <button className="google-signup">
                Login with Email
              </button>
            <button type="submit" className="register">Login</button>
            <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
