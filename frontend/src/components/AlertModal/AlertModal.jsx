// AlertModal.jsx
import React from 'react';
import './AlertModal.css';

export const AlertModal = ({ 
  isOpen, 
  title = 'Alert', 
  message, 
  onConfirm, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div 
        className="alert-modal" 
        onClick={e => e.stopPropagation()}
      >
        <div className="alert-header">{title}</div>
        <div className="alert-body">{message}</div>
        <div className="alert-footer">
          <button 
            className="save-btnalert" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="save-btnalert" 
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
