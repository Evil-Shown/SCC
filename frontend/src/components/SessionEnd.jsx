import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SessionEnd.css";

function SessionEnd({ onClose }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleGoHome = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
      navigate("/");
    }, 300);
  };

  return (
    <div className={`session-end-overlay ${isVisible ? "visible" : ""}`}>
      <div className={`session-end-modal ${isVisible ? "visible" : ""}`}>
        <div className="session-end-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="session-end-title">Session Ended</h2>
        <p className="session-end-message">Your session has expired due to inactivity.</p>
        <button onClick={handleGoHome} className="session-end-button">
          Go to Homepage
        </button>
      </div>
    </div>
  );
}

export default SessionEnd;
