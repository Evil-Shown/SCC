import { useState, useEffect, useRef } from "react";
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
  School,
  ChevronDown
} from "lucide-react";
import "../styles/AuthToggle.css";

const FACULTY_PREFIXES = {
  "Faculty of Computing": "IT",
  "Faculty of Engineering": "EN",
  "Faculty of Business": "BM",
  "Faculty of Medicine": "MD",
  "Faculty of Law": "LW",
  "Faculty of Architecture": "AR",
  "Faculty of Humanities and Sciences": "HS"
};

const FACULTY_DATA = {
  "Faculty of Computing": [
    "Department of IT",
    "Department of Cybersecurity",
    "Department of Network Engineering",
    "Department of Computer Science",
    "Department of Data Science",
    "Department of Software Engineering"
  ],
  "Faculty of Business": [
    "Department of Management",
    "Department of Accounting and Finance",
    "Department of Marketing",
    "Department of Human Resource Management",
    "Department of Logistics and Supply Chain",
    "Department of Economics"
  ],
  "Faculty of Engineering": [
    "Department of Civil Engineering",
    "Department of Electrical and Electronic Engineering",
    "Department of Mechanical Engineering",
    "Department of Mechatronics Engineering"
  ],
  "Faculty of Medicine": [
    "Department of Anatomy",
    "Department of Physiology",
    "Department of Biochemistry",
    "Department of Pathology",
    "Department of Pharmacology"
  ],
  "Faculty of Law": [
    "Department of Public and International Law",
    "Department of Private and Comparative Law",
    "Department of Commercial Law"
  ],
  "Faculty of Architecture": [
    "Department of Architecture",
    "Department of Quantity Surveying",
    "Department of Town and Country Planning"
  ],
  "Faculty of Humanities and Sciences": [
    "Department of English and Modern Languages",
    "Department of Social Sciences",
    "Department of Physical Education",
    "Department of Mathematics and Statistics"
  ]
};

const CustomSelect = ({ label, name, value, options, onChange, placeholder, disabled, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`custom-select-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      {label && <label className="custom-select-label">{label}</label>}
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${!value ? 'placeholder' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="trigger-content">
          {Icon && <Icon size={18} className="select-icon" />}
          <span>{selectedLabel}</span>
        </div>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span className="option-text">{option.label}</span>
              {value === option.value && <CheckCircle size={14} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AuthToggle = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    role: "student",
    studentId: "",
    faculty: "",
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

  const { user } = useSelector((state) => state.auth);
  useEffect(() => {
    if (isAuthenticated && user) {
      const target = user.role === "admin" ? "/admin" : "/dashboard";
      if (justLoggedIn) {
        // Show success message briefly after fresh login/register
        const timer = setTimeout(() => {
          navigate(target, { replace: true });
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        // Already had a valid session — go straight to correct dashboard
        navigate(target, { replace: true });
      }
    }
  }, [isAuthenticated, justLoggedIn, navigate, user]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
      faculty: "",
      department: "",
      year: "",
      phone: "",
      bio: ""
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Restriction: Name should only contain letters and spaces
    if (name === "name" && !/^[a-zA-Z\s]*$/.test(value)) {
      return;
    }

    // Restriction: Phone number should only contain numbers, start with 0, and be max 10 digits
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (value.length > 0 && value[0] !== "0") return; // Must start with 0
      if (numericValue.length > 10) return; // Exactly 10 digits
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    // Restriction: Reset department when faculty changes
    if (name === "faculty") {
      setFormData(prev => ({
        ...prev,
        faculty: value,
        department: "" // Reset department
      }));
      return;
    }

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

  const validateForm = () => {
    if (!isLogin) {
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setValidationError("Please enter a valid email address");
        return false;
      }
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
      if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
        setValidationError("Name can only contain letters and spaces");
        return false;
      }

      if (!formData.faculty) {
        setValidationError("Please select your faculty");
        return false;
      }
      if (!formData.department) {
        setValidationError("Please select your department");
        return false;
      }

      if (formData.role === "student") {
        if (!formData.studentId) {
          setValidationError("Student ID is required");
          return false;
        }

        // Student ID Validation: Logic based on faculty prefixes
        const expectedPrefix = FACULTY_PREFIXES[formData.faculty];
        if (!formData.studentId.startsWith(expectedPrefix)) {
          setValidationError(`Student ID for ${formData.faculty} must start with ${expectedPrefix}`);
          return false;
        }

        if (!/^[a-zA-Z]{1,2}[0-9]+$/.test(formData.studentId)) {
          setValidationError("Student ID must start with letters followed by numbers (no special characters)");
          return false;
        }

        if (/^[0-9]/.test(formData.studentId)) {
          setValidationError("Student ID cannot start with a number");
          return false;
        }
      }

      if (!formData.phone || !/^0\d{9}$/.test(formData.phone)) {
        setValidationError("Phone number must be exactly 10 digits and start with 0");
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
        if (formData.faculty && formData.faculty.trim()) userData.faculty = formData.faculty.trim();
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
              {/* Removed app icon as requested */}
              <span className="logo-text">Smart  Campus<span className="logo-highlight">   Companion</span></span>
            </div>
            
            <h1 className="brand-title-modern">
              Welcome to the Future of Campus Life
            </h1>
            
            <p className="brand-subtitle-modern">
              Experience seamless integration of academics, collaboration, and campus resources in one intelligent platform.
            </p>

            <div className="brand-stats">
              {/* Stats removed as requested */}
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
                    <span>Lecturer</span>
                  </button>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="registration-fields">
                <CustomSelect
                  label="Faculty"
                  name="faculty"
                  value={formData.faculty}
                  options={Object.keys(FACULTY_DATA).map(faculty => ({ label: faculty, value: faculty }))}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Select Faculty"
                  icon={School}
                />

                <CustomSelect
                  label="Department"
                  name="department"
                  value={formData.department}
                  options={formData.faculty ? FACULTY_DATA[formData.faculty].map(dept => ({ label: dept, value: dept })) : []}
                  onChange={handleChange}
                  disabled={isLoading || !formData.faculty}
                  placeholder="Select Department"
                  icon={BookOpen}
                />

                <div className="form-row-modern">
                  <div className="form-group-modern half">
                    <label htmlFor="studentId">
                      <User size={18} />
                      {formData.role === 'student' ? 'Student ID' : 'Employee ID (Optional)'}
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder={formData.role === 'student' && formData.faculty ? `${FACULTY_PREFIXES[formData.faculty]}23XXXXXX` : "e.g., ID123456"}
                      disabled={isLoading}
                      className="form-input-modern"
                      required={formData.role === 'student'}
                    />
                    {formData.role === 'student' && formData.faculty && (
                      <span className="field-hint" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        Must start with {FACULTY_PREFIXES[formData.faculty]}
                      </span>
                    )}
                  </div>

                  <div className="form-group-modern half">
                    <CustomSelect
                      label="Year"
                      name="year"
                      value={formData.year}
                      options={[
                        { label: "1st Year", value: "1" },
                        { label: "2nd Year", value: "2" },
                        { label: "3rd Year", value: "3" },
                        { label: "4th Year", value: "4" }
                      ]}
                      onChange={handleChange}
                      disabled={isLoading || formData.role !== 'student'}
                      placeholder={formData.role === 'student' ? "Select Year" : "N/A"}
                      icon={Calendar}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label htmlFor="phone">
                    <Phone size={18} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0771234567"
                    disabled={isLoading}
                    className="form-input-modern"
                    required
                  />
                  <span className="field-hint" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    Must be 10 digits starting with 0 (e.g., 0771234567)
                  </span>
                </div>
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