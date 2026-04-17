import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import AuthToggle from "../components/AuthToggle";

const AuthPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const getDashboardPathByRole = (role) => {
    const normalizedRole = String(role || "").toLowerCase();
    return normalizedRole === "admin" ? "/admin" : "/dashboard";
  };

  // If already logged in, skip auth form entirely
  if (isAuthenticated) {
    return <Navigate to={getDashboardPathByRole(user?.role)} replace />;
  }

  return <AuthToggle />;
};

export default AuthPage;