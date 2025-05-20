import React from 'react';
import '../Login.css'; // Ensure the CSS file path is correct
import { Link } from 'react-router-dom'; // Use Link for React routing

export function LoginAdmin() {
  return (
    <>
      <div className="background">
        <img src={`${process.env.PUBLIC_URL}/Materials/forensic.jpg`} alt="Forensic Background" className="bg-image" />
        <div className="overlay">
          <div className="img-container">
            <div className="logo">
              {/* Use Link for internal navigation */}
              <Link to="/LoginAdmin">
                <img src= {`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`} alt="Endicott Police Logo" />
              </Link>
            </div>
            <h1 className="main_heading">PIMS</h1>
          </div>
          <div className="form-container">
            <form className="login-form">
              <input type="text" placeholder="Username" required />
              <input type="password" placeholder="Password" required />
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
              {/* <p>
                Don't have an account? <Link to="/register">Sign up</Link>
              </p> */}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
