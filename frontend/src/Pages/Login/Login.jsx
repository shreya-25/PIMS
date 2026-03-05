import React, { useState } from 'react';
import styles from './Login.module.css';
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import api from "../../api"; // adjust the path as needed


export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
        // Debug log before making the request
        console.log("Attempting login for:", username);

        
        const response = await api.post("/api/auth/login", {
            username,
            password,
        });

        // Extract required data from response
        const { token, userId, username: name, role } = response.data;

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
        localStorage.setItem("userId", userId);
        localStorage.setItem("loggedInUser", name);  // Trim to avoid space issues
        // localStorage.setItem("role", role);

        console.log("Stored in localStorage:", {
            token: localStorage.getItem("token"),
            loggedInUser: localStorage.getItem("loggedInUser"),
            // role: localStorage.getItem("role"),
        });

        navigate("/HomePage");

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
    <div className={styles.background}>
      <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Forensic Background" className={styles.bgImage} />
      <div className={styles.overlay}>
        <div className={styles.mainBox}>
        <div className={styles.imgContainer}>
          <div className={styles.logo}>
            {/* <Link to="/LoginAdmin"> */}
              <img src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} alt="Endicott Police Logo" />
            {/* </Link> */}
          </div>
          <h1 className={styles.mainHeading}>PIMS</h1>
          <p className={styles.subHeading}>Police Investigation Management System</p>
        </div>
        <div className={styles.formContainer}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
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
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            <button type="submit" className={styles.register}>Login</button>
            <div className={styles.forgotPass}>
              <a href="#">Forgot password?</a>
            </div>
            <div className={styles.divider}>
              <span>or</span>
            </div>
            <button
            type="button"
            className={styles.googleSignup}>
                Login with Email
              </button>
            {/* <p>
              Don't have an account? <Link to="/register">Sign up</Link>
            </p> */}
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
