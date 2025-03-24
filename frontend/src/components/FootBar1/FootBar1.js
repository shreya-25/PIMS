import React from "react";
import "./FootBar.css";

const FootBar1 = ({ onPrevious, onNext }) => {
  return (
    <div className="footbar">
      <button className="footbar-btn prev" onClick={onPrevious}>
        Previous
      </button>
    </div>
  );
};

export default FootBar1;
