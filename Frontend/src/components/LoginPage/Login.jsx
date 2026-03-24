import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import authImage from "../../assets/images/auth.png";
import logoImage from "../../assets/images/logo.png";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ THIS IS THE IMPORTANT PART
  useEffect(() => {
    // Disable scroll when login page loads
    document.body.style.overflow = "hidden";

    // Re-enable scroll when leaving login page
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Student",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.username,
          user_id: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        navigate("/");
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-left">
          <div className="left">
            <h1 className="login-title">AcadFlow</h1>
            <p className="login-subtitle">
              Learning grows where knowledge meets opportunity.
            </p>
            <div className="login-illustration">
              <img src={authImage} alt="Illustration" />
            </div>
          </div>
        </div>

        <div className="login-right">
          <img src={logoImage} alt="Logo" className="login-logo" />

          <hr className="divider" />

          <p className="error-message">{error}</p>

          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Username (Email)"
              className="login-input"
              value={formData.username}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password (User ID)"
              className="login-input"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <select
              name="role"
              className="login-input"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Admin">Admin</option>
            </select>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
