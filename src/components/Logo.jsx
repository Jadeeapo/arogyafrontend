import React from "react";
import "./Logo.css";

const Logo = ({ variant = "horizontal", size = "medium" }) => {
  return (
    <div className={`logo-container logo-${variant} logo-${size}`}>
      <img
        src="/arogya-logo.svg"
        alt="Arogya Hospital Management System"
        className="logo-image"
      />
    </div>
  );
};

export default Logo;
