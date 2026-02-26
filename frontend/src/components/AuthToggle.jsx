import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register, login, clearError } from "../features/auth/authSlice";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  MapPin,
  Phone,
  Github,
  Linkedin,
  Chrome,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Briefcase,
  School
} from "lucide-react";
import "../styles/AuthToggle.css";

const AuthToggle = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    role: "student",
    studentId: "",
    department: "",
    year: "",
    phone: "",
    bio: ""
  });
  
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [touchedFields, setTouchedFields] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (justLoggedIn) {
        // Show success message briefly after fresh login/register
        const timer = setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        // Already had a valid session — go straight to dashboard
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, justLoggedIn, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    setValidationError("");
    setSuccessMessage("");
  };

  const handleBlur = (field) => {
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    if (password.match(/[$@#&!]+/)) strength += 25;
    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return "#ef4444";
    if (passwordStrength < 75) return "#f59e0b";
    return "#10b981";
  };

  const toggleMode = (mode) => {
    setIsLogin(mode === "login");
    setActiveTab(mode);
    setValidationError("");
    setSuccessMessage("");
    setTouchedFields({});
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
      role: "student",
      studentId: "",
      department: "",
      year: "",
      phone: "",
      bio: ""
    });
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setValidationError("Passwords don't match");
        return false;
      }
      if (formData.password.length < 8) {
        setValidationError("Password must be at least 8 characters");
        return false;
      }
      if (!formData.name.trim()) {
        setValidationError("Full name is required");
        return false;
      }
      if (formData.role === "student" && !formData.studentId) {
        setValidationError("Student ID is required");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setValidationError("");
    setSuccessMessage("");
    dispatch(clearError());

    if (!validateForm()) return;

    try {
      if (isLogin) {
        const result = await dispatch(login({ 
          email: formData.email, 
          password: formData.password,
          rememberMe 
        }));
        
        if (login.fulfilled.match(result)) {
          setJustLoggedIn(true);
          setSuccessMessage("Login successful! Redirecting to dashboard...");
          // Navigation will be handled by the useEffect watching isAuthenticated
        } else if (login.rejected.match(result)) {
          // Error will be set by Redux
          console.error("Login failed:", result.payload);
        }
      } else {
        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };

        // Add optional fields only if they have values
        if (formData.phone && formData.phone.trim()) userData.phone = formData.phone.trim();
        if (formData.bio && formData.bio.trim()) userData.bio = formData.bio.trim();
        if (formData.studentId && formData.studentId.trim()) userData.studentId = formData.studentId.trim();
        if (formData.department && formData.department.trim()) userData.department = formData.department.trim();
        if (formData.year) userData.year = parseInt(formData.year);

        const result = await dispatch(register(userData));
        
        if (register.fulfilled.match(result)) {
          setJustLoggedIn(true);
          setSuccessMessage("Registration successful! Redirecting to dashboard...");
          // Navigation will be handled by the useEffect watching isAuthenticated
        } else if (register.rejected.match(result)) {
          // Error will be set by Redux
          console.error("Registration failed:", result.payload);
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setValidationError("An unexpected error occurred. Please try again.");
    }
  };

  const socialLogin = (provider) => {
    // Implement social login logic
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className="auth-container-modern">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="gradient-sphere"></div>
        <div className="gradient-sphere-2"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="auth-wrapper-modern">
        {/* Left Side - Enhanced Branding */}
        <div className="auth-brand-modern">
          <div className="brand-content-modern">
            <div className="brand-logo">
              <GraduationCap size={48} className="logo-icon" />
              <span className="logo-text">Smart  Campus<span className="logo-highlight">   Companion</span></span>
            </div>
            
            <h1 className="brand-title-modern">
              Welcome to the Future of Campus Life
            </h1>
            
            <p className="brand-subtitle-modern">
              Experience seamless integration of academics, collaboration, and campus resources in one intelligent platform.
            </p>

            <div className="brand-stats">
              <div className="stat-item">
                <span className="stat-value">10k+</span>
                <span className="stat-label">Active Students</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">500+</span>
                <span className="stat-label">Faculty Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>

            <div className="brand-features-modern">
              <div className="feature-card">
                <BookOpen className="feature-icon" size={24} />
                <div className="feature-text">
                  <h4>Smart Learning</h4>
                  <p>AI-powered course recommendations</p>
                </div>
              </div>
              
              <div className="feature-card">
                <Calendar className="feature-icon" size={24} />
                <div className="feature-text">
                  <h4>Intelligent Scheduling</h4>
                  <p>Optimize your academic calendar</p>
                </div>
              </div>
              
              <div className="feature-card">
                <MessageSquare className="feature-icon" size={24} />
                <div className="feature-text">
                  <h4>Collaborative Hub</h4>
                  <p>Real-time study groups & discussions</p>
                </div>
              </div>
              
              <div className="feature-card">
                <MapPin className="feature-icon" size={24} />
                <div className="feature-text">
                  <h4>Campus Navigation</h4>
                  <p>Interactive maps & event tracking</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side - Enhanced Auth Form */}
        <div className="auth-card-modern">
          <div className="auth-header-modern">
            <h2>{isLogin ? "Welcome Back!" : "Join the Community"}</h2>
            <p>
              {isLogin 
                ? "Enter your credentials to access your personalized dashboard"
                : "Create an account and start your smart campus journey"}
            </p>
          </div>

          {/* Social Login Options */}
          <div className="social-login">
            <button 
              className="social-btn google"
              onClick={() => socialLogin('google')}
              disabled={isLoading}
            >
              <Chrome size={20} />
              <span>Google</span>
            </button>
            <button 
              className="social-btn github"
              onClick={() => socialLogin('github')}
              disabled={isLoading}
            >
              <Github size={20} />
              <span>GitHub</span>
            </button>
            <button 
              className="social-btn linkedin"
              onClick={() => socialLogin('linkedin')}
              disabled={isLoading}
            >
              <Linkedin size={20} />
              <span>LinkedIn</span>
            </button>
          </div>

          <div className="auth-divider">
            <span className="divider-line"></span>
            <span className="divider-text">or continue with email</span>
            <span className="divider-line"></span>
          </div>

          {/* Error/Success Messages */}
          {(error || validationError) && (
            <div className="auth-message error">
              <AlertCircle size={20} />
              <span>{error || validationError}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-message success">
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-modern">
            {/* Name Field - Register Only */}
            {!isLogin && (
              <div className={`form-group-modern ${touchedFields.name && !formData.name ? 'error' : ''}`}>
                <label htmlFor="name">
                  <User size={18} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  required
                  placeholder="John Doe"
                  disabled={isLoading}
                  className="form-input-modern"
                />
                {touchedFields.name && !formData.name && (
                  <span className="field-error">Name is required</span>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group-modern">
              <label htmlFor="email">
                <Mail size={18} />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                required
                placeholder="you@university.edu"
                disabled={isLoading}
                className="form-input-modern"
              />
            </div>

            {/* Role Selection - Register Only */}
            {!isLogin && (
              <div className="form-group-modern">
                <label>
                  <UserCheck size={18} />
                  I am a
                </label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-btn ${formData.role === 'student' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, role: 'student'})}
                  >
                    <GraduationCap size={20} />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    className={`role-btn ${formData.role === 'teacher' ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, role: 'teacher'})}
                  >
                    <Briefcase size={20} />
                    <span>Faculty</span>
                  </button>
                </div>
              </div>
            )}

            {/* Student Specific Fields */}
            {!isLogin && formData.role === "student" && (
              <div className="student-fields">
                <div className="form-row-modern">
                  <div className="form-group-modern half">
                    <label htmlFor="studentId">
                      <School size={18} />
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="e.g., STU2024001"
                      disabled={isLoading}
                      className="form-input-modern"
                    />
                  </div>

                  <div className="form-group-modern half">
                    <label htmlFor="year">
                      <Calendar size={18} />
                      Year
                    </label>
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="form-select-modern"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    disabled={isLoading}
                    className="form-input-modern"
                  />
                </div>
              </div>
            )}

            {/* Faculty Specific Fields */}
            {!isLogin && formData.role === "teacher" && (
              <div className="form-group-modern">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  disabled={isLoading}
                  className="form-input-modern"
                />
              </div>
            )}

            {/* Phone Number - Register Only */}
            {!isLogin && (
              <div className="form-group-modern">
                <label htmlFor="phone">
                  <Phone size={18} />
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  disabled={isLoading}
                  className="form-input-modern"
                />
              </div>
            )}

            {/* Password Field */}
            <div className="form-group-modern">
              <label htmlFor="password">
                <Lock size={18} />
                Password
              </label>
              <div className="password-input-wrapper-modern">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  required
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="form-input-modern"
                />
                <button
                  type="button"
                  className="password-toggle-modern"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator - Register Only */}
              {!isLogin && formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="strength-text">
                    {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'} password
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password - Register Only */}
            {!isLogin && (
              <div className="form-group-modern">
                <label htmlFor="confirmPassword">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <div className="password-input-wrapper-modern">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    required
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="form-input-modern"
                  />
                  <button
                    type="button"
                    className="password-toggle-modern"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {touchedFields.confirmPassword && 
                 formData.password !== formData.confirmPassword && (
                  <span className="field-error">Passwords don't match</span>
                )}
              </div>
            )}

            {/* Remember Me & Forgot Password - Login Only */}
            {isLogin && (
              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-label">Remember me</span>
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot Password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn-modern btn-glitch"
              data-text={isLogin ? "Sign In" : "Create Account"}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner-modern"></span>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Between Login/Register */}
          <div className="auth-footer-modern">
            <p>
              {isLogin ? "New to CampusSmart? " : "Already have an account? "}
              <button
                className="toggle-link-modern"
                onClick={() => toggleMode(isLogin ? "register" : "login")}
              >
                {isLogin ? "Create an account" : "Sign in"}
                <ChevronRight size={16} />
              </button>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="terms-privacy">
            <p>
              By continuing, you agree to our{" "}
              <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthToggle;