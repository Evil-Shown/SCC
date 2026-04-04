import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setCredentials } from "../features/auth/authSlice";

const parseHashParams = (hash) => {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const GoogleAuthCallback = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const params = parseHashParams(window.location.hash || location.hash || "");
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userParam = params.get("user");
    const error = params.get("google_error");
    const mode = params.get("mode") || "login";

    if (error) {
      setMessage(`Google sign-in failed: ${error}`);
      const timer = setTimeout(() => navigate("/auth", { replace: true }), 2200);
      return () => clearTimeout(timer);
    }

    if (!accessToken || !refreshToken || !userParam) {
      setMessage("Missing Google sign-in data. Returning to login.");
      const timer = setTimeout(() => navigate("/auth", { replace: true }), 2200);
      return () => clearTimeout(timer);
    }

    try {
      const user = JSON.parse(userParam);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      window.history.replaceState({}, document.title, location.pathname);
      if (mode === "register") {
        navigate("/", { replace: true });
      } else {
        navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (parseError) {
      console.error("Google auth callback parse error:", parseError);
      setMessage("Could not complete Google sign-in. Returning to login.");
      const timer = setTimeout(() => navigate("/auth", { replace: true }), 2200);
      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated, location.pathname, location.hash, navigate]);

  return (
    <div className="dashboard-loading" style={{ minHeight: "100vh" }}>
      <div className="loading-spinner" />
      <span>{message}</span>
    </div>
  );
};

export default GoogleAuthCallback;