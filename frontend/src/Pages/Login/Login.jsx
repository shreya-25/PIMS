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
        // Debug log before making the request
        console.log("Attempting login for:", username);

        const response = await axios.post("http://localhost:5000/api/auth/login", {
            username,
            password,
        });

        // Extract required data from response
        const { token, username: loggedInUser, role } = response.data;

        // Debug logs
        console.log("Login successful!");
        console.log("Received from backend:", response.data);

        // Handle missing token
        if (!token) {
            setErrorMessage("Authentication failed: Token not provided by the server.");
            return;
        }

        // Clear any stale data in localStorage after successful login
        localStorage.clear();

        // Save token and user details to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("loggedInUser", loggedInUser);  // Trim to avoid space issues
        // localStorage.setItem("role", role);

        console.log("Stored in localStorage:", {
            token: localStorage.getItem("token"),
            loggedInUser: localStorage.getItem("loggedInUser"),
            // role: localStorage.getItem("role"),
        });

        navigate("/MainPage");

        // // Navigate based on role
        // if (role === "Investigator" || role === "CaseManager") {
        //     navigate("/MainPage");
        // } else {
        //     setErrorMessage("Unauthorized role. Please contact admin.");
        // }
    } catch (error) {
        console.error("Login error:", error);
        
        // Check if the backend provided an error response
        if (error.response) {
            setErrorMessage(error.response.data.message || "Invalid username or password.");
        } else {
            setErrorMessage("An unexpected network error occurred. Please try again.");
        }
    }
};


  return (
    <div className="background">
      <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Forensic Background" className="bg-image" />
      <div className="overlay">
        <div className="img-container">
          <div className="logo">
            <Link to="/LoginAdmin">
              <img src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} alt="Endicott Police Logo" />
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
