import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";
import { getAccessToken } from "../utils/authStorage.js";

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] — if set, user must have one of these roles (e.g. teacher, admin)
 * @param {string} [props.redirectTo] — where to send users who fail the role check (default "/timetable")
 */
const ProtectedRoute = ({ children, roles, redirectTo = "/timetable" }) => {
  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);

  // While verifying auth on page refresh, show loading instead of redirecting
  if (isLoading && !isAuthenticated && getAccessToken()) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
