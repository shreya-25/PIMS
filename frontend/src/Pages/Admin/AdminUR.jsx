import React, { useState } from "react";
import "./AdminUR.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

export const AdminUR = () => {
  

  const navigate = useNavigate();

  const handleNavigation = (route) => {
    navigate(route); // Navigate to the respective page
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!formData.agreeToTerms) {
      alert("You must agree to the terms of service.");
      return;
    }
    console.log("Form submitted", formData);
    // Add further form submission logic here
  };


  return (
    <div className="admin-container">
      <Navbar />

      <div className="top-menu">
        <div className="menu-items">
        <span className="menu-item active" onClick={() => handleNavigation('/AdminUR')}>
            User Registration
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminCM')}>
           Case Management
          </span>
          <span className="menu-item"onClick={() => handleNavigation('/AdminSC')} >
            Search Cases
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Search People
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Calendar
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Dashboard
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminSP')} >
            Discussion
          </span>
          <span className="menu-item" onClick={() => handleNavigation('/AdminDB')} >
           Database Backup
          </span>
         </div>
       </div>

      <div className="logo-sec">
        <img
          src={`${process.env.PUBLIC_URL}/Materials/newpolicelogo.png`}
          alt="Police Department Logo"
          className="police-logo-main-page"
        />
        <h1 className="main-page-heading">PIMS</h1>
      </div>

      <div className="registration-form">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
           <input
            type="role"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleInputChange}
            required
          />
          <input
            type="username"
            name="username"
            placeholder="Username"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />
          {/* Allow User to Create Case Checkbox */}
          <div className="checkbox-container">
            <input
              type="checkbox"
              name="canCreateCase"
              checked={formData.canCreateCase}
              onChange={handleInputChange}
            />
            <label>Allow user to create a case</label>
          </div>
          <button type="submit">Add User</button>
        </form>
      </div>
    </div>
  );
};
