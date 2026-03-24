import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Login.css";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [message, setMessage] = useState("Signing you in with Google...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const userParam = params.get("user");

    if (error) {
      setMessage(error);
      return;
    }

    if (!userParam) {
      setMessage("Google login response was not received.");
      return;
    }

    try {
      const user = JSON.parse(userParam);
      login(user);
      navigate("/");
    } catch (parseError) {
      setMessage("Unable to complete Google login.");
    }
  }, [login, navigate]);

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-right" style={{ margin: "0 auto" }}>
          <h1 className="login-title">AcadFlow</h1>
          <p className="login-subtitle" style={{ textAlign: "center", marginTop: "16px" }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
