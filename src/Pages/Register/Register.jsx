import React, { useState } from 'react';
import '../Login.css';
import { Link, useNavigate } from 'react-router-dom';

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    // Retrieve existing users from localStorage
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // Check if the username or email is already registered
    const isUsernameTaken = existingUsers.some((user) => user.username === username);
    const isEmailTaken = existingUsers.some((user) => user.email === email);

    if (isUsernameTaken) {
      setErrorMessage('Username is already taken. Please choose a different username.');
      return;
    }

    if (isEmailTaken) {
      setErrorMessage('Email is already registered. Please use a different email.');
      return;
    }

    // Save the new user to the existing users list
    const newUser = { firstName, lastName, email, username, password };
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

    // Clear the form fields
    setFirstName('');
    setLastName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setErrorMessage('');

    // Redirect to login page
    navigate('/');
  };

  return (
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
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
             <div className="divider">
                <span>or</span>
              </div>
              <button className="google-signup">
                Register with Email
              </button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <button type="submit" className="register">Register</button>
            <p>
              Already have an account? <Link to="/">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
