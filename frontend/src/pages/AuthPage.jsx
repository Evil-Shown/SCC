import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import AuthToggle from "../components/AuthToggle";

const AuthPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  // If already logged in, skip auth form entirely
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthToggle />;
};

export default AuthPage;