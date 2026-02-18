import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register, login, clearError } from "../features/auth/authSlice";
import "../styles/AuthToggle.css";

const AuthToggle = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    // Login fields
    email: "",
    password: "",
    // Register fields
    name: "",
    confirmPassword: "",
    role: "student",
    studentId: "",
    department: "",
    year: ""
  });
  const [validationError, setValidationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setValidationError("");
  };

  const toggleMode = (mode) => {
    setIsLogin(mode === "login");
    setActiveTab(mode);
    setValidationError("");
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
      role: "student",
      studentId: "",
      department: "",
      year: ""
    });
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setValidationError("Passwords do not match");
        return false;
      }
      if (formData.password.length < 6) {
        setValidationError("Password must be at least 6 characters long");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (isLogin) {
      // Login
      dispatch(login({ email: formData.email, password: formData.password }));
    } else {
      // Register
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      if (formData.studentId) userData.studentId = formData.studentId;
      if (formData.department) userData.department = formData.department;
      if (formData.year) userData.year = parseInt(formData.year);

      dispatch(register(userData));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-title">Smart Campus Companion</h1>
            <p className="brand-subtitle">Your All-in-One Campus Solution</p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>Course Management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>Study Groups</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📅</span>
                <span>Event Calendar</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>Real-time Chat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
              onClick={() => toggleMode("login")}
            >
              Login
            </button>
            <button
              className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
              onClick={() => toggleMode("register")}
            >
              Register
            </button>
          </div>

          <div className="auth-header">
            <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
            <p>
              {isLogin
                ? "Enter your credentials to access your account"
                : "Fill in the details to get started"}
            </p>
          </div>

          {(error || validationError) && (
            <div className="auth-error">
              <span className="error-icon">⚠️</span>
              <span>{error || validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="form-input"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                disabled={isLoading}
                className="form-input"
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="form-select"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                {formData.role === "student" && (
                  <>
                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="studentId">Student ID</label>
                        <input
                          type="text"
                          id="studentId"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleChange}
                          placeholder="Enter ID"
                          disabled={isLoading}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group half">
                        <label htmlFor="year">Year</label>
                        <select
                          id="year"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="form-select"
                        >
                          <option value="">Select</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                          <option value="5">5th Year</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="department">Department</label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., Computer Science"
                        disabled={isLoading}
                        className="form-input"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="forgot-password">
                <a href="/forgot-password">Forgot Password?</a>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner">Loading...</span>
              ) : isLogin ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                className="toggle-link"
                onClick={() => toggleMode(isLogin ? "register" : "login")}
              >
                {isLogin ? "Register here" : "Login here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthToggle;