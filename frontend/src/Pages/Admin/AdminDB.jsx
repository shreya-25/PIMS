import React, { useState } from "react";
import "./AdminDB.css";
import Navbar from "../../components/Navbar/Navbar";
import Searchbar from "../../components/Searchbar/Searchbar";
import { SlideBar } from "../../components/Slidebar/Slidebar";
import { SideBar } from "../../components/Sidebar/Sidebar";
import { CaseSelector } from "../../components/CaseSelector/CaseSelector";
import { useNavigate } from "react-router-dom";

export const AdminDB = () => {
  

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
        <span className="menu-item " onClick={() => handleNavigation('/AdminUR')}>
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
          <span className="menu-item active" onClick={() => handleNavigation('/AdminDB')} >
           Database Backup
          </span>
         </div>
       </div>

      <div className="logo-sec">
        <img
          src="/Materials/newpolicelogo.png" 
          alt="Police Department Logo"
          className="police-logo-main-page"
        />
        <h1 className="main-page-heading">PIMS</h1>
      </div>

      <div className="registration-form">
        <h1>Database Backup</h1>
        <form onSubmit={handleSubmit}>
          
          <button type="submit">Backup</button>
        </form>
      </div>
    </div>
  );
};
