import React from 'react';
import '../Login.css'; 
import { Link } from 'react-router-dom'; 
export function RegisterAdmin() {
  return (
    <>
      <div className="background">
        <img src="/Materials/forensic.jpg" alt="Forensic Background" className="bg-image" />
        <div className="overlay">
          <div className="img-container">
            <div className="logo">
            <Link to="/RegisterAdmin">
                <img src="/Materials/newpolicelogo.png" alt="Endicott Police Logo" />
              </Link>
            </div>
            <h1 className="main_heading">PIMS</h1>
          </div>
          <div className="form-container">
            <form>
              <input type="text" placeholder="First name" required />
              <input type="text" placeholder="Last name" required />
              <input type="email" placeholder="Email address" required />
              <input type="text" placeholder="Username" required />
              <input type="password" placeholder="Password" required />
              <div className="divider">
                <span>or</span>
              </div>
              <button className="google-signup">
              Register with Email
              </button>
              <button type="submit" className="register">Admin Register</button>
              <p>
                Already have an account? <Link to="/">Login</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
