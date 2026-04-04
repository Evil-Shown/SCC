import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"; // Provider ඉවත් කර ඇත
import { useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { fetchUserProfile, updateLastActivity, resetAuth } from "./features/auth/authSlice";
import SessionEnd from "./components/SessionEnd";
import { initSocket } from "./socket/socket";

// Pages
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Notes from "./pages/Notes";
import NoteDetail from "./pages/NoteDetail";
import Kuppi from "./pages/Kuppi";
import Notifications from "./pages/Notifications";
import CommunityPage from "./pages/CommunityPage";
import ResourcesPage from "./pages/ResourcesPage";
import TutorsPage from "./pages/TutorsPage";
import Timetable from "./pages/Timetable";
import AiChat from "./pages/AiChat";
import AdminDashboard from "./pages/AdminDashboard";
import ExamMode from './pages/ExamMode'; 

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import ExamLogin from './components/Exam/ExamLogin';
import ExamProtectedRoute from './components/ExamProtectedRoute'; 

// Styles
import "./App.css";
import "./styles/Uiverse.css";

// Re-verify auth and re-init socket on page load/refresh
function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const { accessToken, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchUserProfile());
    }
  }, [accessToken, dispatch]); 

  useEffect(() => {
    if (accessToken && user?._id) {
      initSocket(user._id);
    }
  }, [accessToken, user?._id]);

  return children;
}

function App() {
  // Session timeout logic (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000; 
  const [sessionEnded, setSessionEnded] = useState(false);
  
  // Redux hooks - Provider එක main.jsx හි ඇති බැවින් මෙහිදී ක්‍රියා කරයි
  const dispatch = useDispatch();
  const lastActivity = useSelector((state) => state.auth.lastActivity);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const timerRef = useRef();

  // Reset timer on user activity
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleActivity = () => {
      dispatch(updateLastActivity());
    };
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [isAuthenticated, dispatch]);

  // Check for inactivity periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      // Redux state එකෙන් කෙලින්ම අගය පරීක්ෂා කිරීම
      if (now - lastActivity > SESSION_TIMEOUT) {
        setSessionEnded(true);
        dispatch(resetAuth());
        clearInterval(timerRef.current);
      }
    }, 10000); 
    return () => clearInterval(timerRef.current);
  }, [isAuthenticated, lastActivity, dispatch, SESSION_TIMEOUT]);

  const handleSessionEndClose = () => {
    setSessionEnded(false);
  };

  return (
    <AuthInitializer>
      <ThemeProvider>
        <Router>
          <div className="app">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-text)",
                  border: "1px solid var(--toast-border)",
                },
                success: {
                  iconTheme: { primary: "#10b981", secondary: "#052e1b" },
                },
                error: {
                  iconTheme: { primary: "#ef4444", secondary: "#450a0a" },
                },
              }}
            />
            <ThemeToggle />
            {sessionEnded && <SessionEnd onClose={handleSessionEndClose} />}
            
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/tutors" element={<TutorsPage />} />

              {/* --- Standard Protected Routes --- */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
              <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
              <Route path="/notes/:noteId" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />
              <Route path="/kuppi" element={<ProtectedRoute><Kuppi /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/timetable" element={<ProtectedRoute><Timetable /></ProtectedRoute>} />
              <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

              {/* --- Exam Mode Routes --- */}
              <Route 
                path="/exam-login" 
                element={<ProtectedRoute><ExamLogin /></ProtectedRoute>} 
              />
              
              <Route
                path="/exam-mode"
                element={
                  <ExamProtectedRoute>
                    <ExamMode />
                  </ExamProtectedRoute>
                }
              />

              {/* 404 Fallback */}
              <Route path="*" element={<div className="p-10 text-center"><h1>404 - Not Found</h1></div>} />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </AuthInitializer>
  );
}

export default App;