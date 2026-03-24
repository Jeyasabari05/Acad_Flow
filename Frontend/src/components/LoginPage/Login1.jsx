import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import authImage from "../../assets/images/auth.png";
import logoImage from "../../assets/images/logo.png";
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    // Dummy user data (Replace with actual Google login API)
    // const userData = {
    //   email: "jeyasabari.admin@bitsathy.ac.in",
    //   user_id: "AD1001",
    //   role: "Admin",
    // };
    // const userData = {
    //   email: "jeyasabari.faculty@bitsathy.ac.in",
    //   user_id: "ME10101",
    //   role: "Faculty",
    // };
    const userData = {
      email: "jeyasabari.student@bitsathy.ac.in",
      user_id: "7376231ME120",
      role: "Student",
    };

    try {
      const response = await fetch("https://acad-backend-ve2l.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user); // Update AuthContext state immediately
        
        // Redirect based on role
        if (data.user.role === "Student") {
          navigate("/");
        } else if (data.user.role === "Faculty") {
          navigate("/");
        } else if (data.user.role === "Admin") {
          navigate("/");
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError("Server error. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-left">
          <div className="left">
            <h1 className="login-title">Wiki BIT</h1>
            <p className="login-subtitle">
              A student thrives on the foundation of knowledge, the light of curiosity, and the guidance of resources, which empower their journey to success.
            </p>
            <div className="login-illustration">
              <img src={authImage} alt="Illustration" />
            </div>
          </div>
        </div>
        <div className="login-right">
          <img src={logoImage} alt="Logo" className="login-logo" />
          <div className="login-signin">Sign In</div>
          <div className="login-access">Get access to your account</div>
          <hr className="divider" />
          {error && <p className="error-message">{error}</p>}
          <form className="login-form">
            <button
              type="button"
              className="login-button-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faGoogle} className="google-icon" />
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
