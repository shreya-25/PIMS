import React from 'react';
import './Button.css'; // Import the CSS file for button styles

const Button = ({ label, name, onClick, color, className }) => {
  return (
    <button
      name={name}
      onClick={onClick}
      className={className} // Allow custom CSS classes
      style={{
        backgroundColor: color, // Apply dynamic color
        color: '#fff', // Default text color
        border: 'none',
        padding: '10px 15px',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
};

export default Button;
