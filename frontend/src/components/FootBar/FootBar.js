import React from "react";
import "./FootBar.css";

const FootBar = ({ onPrevious, onNext }) => {
  return (
    <div className="footbar">
      <button className="footbar-btn prev" onClick={onPrevious}>
        Previous
      </button>

      <button className="footbar-btn next" onClick={onNext}>
        Next
      </button>
    </div>
  );
};

export default FootBar;
