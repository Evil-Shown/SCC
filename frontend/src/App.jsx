import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "react-hot-toast";
import store from "./store/store";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { fetchUserProfile, updateLastActivity, resetAuth } from "./features/auth/authSlice";
import SessionEnd from "./components/SessionEnd";
import { initSocket } from "./socket/socket";

// Pages
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Notes from "./pages/Notes";
import NoteDetail from "./pages/NoteDetail";
import Kuppi from "./pages/Kuppi";
import Notifications from "./pages/Notifications";
import ExamMode from './pages/ExamMode';
import CommunityPage from "./pages/CommunityPage";
import ResourcesPage from "./pages/ResourcesPage";
import TutorsPage from "./pages/TutorsPage";
import TimetableHome from "./pages/TimetableHome";
import Resources from "./pages/Resources";
import Modules from "./pages/Modules";
import GenerateTimetable from "./pages/GenerateTimetable";
import SemesterTimetableView from "./pages/SemesterTimetableView";
import TimetableSearch from "./pages/TimetableSearch";
import AiChat from "./pages/AiChat";
import AdminDashboard from "./pages/AdminDashboard";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// අලුතින් හැදූ Exam Mode Components Import කරගැනීම
import ExamLogin from './components/Exam/ExamLogin';

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (accessToken && user?._id) {
      initSocket(user._id);
    }
  }, [accessToken, user?._id]);

  return children;
}

function AppShell({ sessionEnded, handleSessionEndClose }) {
  const location = useLocation();

  return (
    <div className="app">
      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3200,
          style: {
            background: "var(--toast-bg)",
            color: "var(--toast-text)",
            border: "1px solid var(--toast-border)",
            borderRadius: "16px",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(18px)",
          },
          loading: {
            style: {
              background: "var(--toast-bg)",
              color: "var(--toast-text)",
              border: "1px solid var(--toast-border)",
            },
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#052e1b",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#450a0a",
            },
          },
        }}
      />
      <ThemeToggle />
      {sessionEnded && <SessionEnd onClose={handleSessionEndClose} />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="app-route-shell"
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes/:noteId"
              element={
                <ProtectedRoute>
                  <NoteDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kuppi"
              element={
                <ProtectedRoute>
                  <Kuppi />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="/exam-login" element={<ExamLogin />} />
            <Route
              path="/exam-mode"
              element={
                <ProtectedRoute>
                  <ExamMode />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timetable"
              element={
                <ProtectedRoute>
                  <Timetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <AiChat />
                </ProtectedRoute>
              }
            />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/tutors" element={<TutorsPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  // Session timeout logic
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
  const [sessionEnded, setSessionEnded] = useState(false);
  const dispatch = store.dispatch;
  const lastActivity = store.getState().auth.lastActivity;
  const isAuthenticated = store.getState().auth.isAuthenticated;
  const timerRef = useRef();

  // Reset timer on activity
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

  // Check for inactivity
  useEffect(() => {
    if (!isAuthenticated) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - store.getState().auth.lastActivity > SESSION_TIMEOUT) {
        setSessionEnded(true);
        dispatch(resetAuth());
        clearInterval(timerRef.current);
      }
    }, 10000); // check every 10s
    return () => clearInterval(timerRef.current);
  }, [isAuthenticated, lastActivity, dispatch]);

  const handleSessionEndClose = () => {
    setSessionEnded(false);
  };

  return (
    <Provider store={store}>
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
                    iconTheme: {
                      primary: "#10b981",
                      secondary: "#052e1b",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#450a0a",
                    },
                  },
                }}
              />
              <ThemeToggle />
              {sessionEnded && <SessionEnd onClose={handleSessionEndClose} />}
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Groups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:groupId"
                  element={
                    <ProtectedRoute>
                      <GroupDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <Notes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes/:noteId"
                  element={
                    <ProtectedRoute>
                      <NoteDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/kuppi"
                  element={
                    <ProtectedRoute>
                      <Kuppi />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                <Route path="/exam-login" element={<ExamLogin />} />
                <Route
                  path="/exam-mode"
                  element={
                    <ProtectedRoute>
                      <ExamMode />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/timetable"
                  element={
                    <ProtectedRoute>
                      <TimetableHome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/resources"
                  element={
                    <ProtectedRoute>
                      <Resources />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/modules"
                  element={
                    <ProtectedRoute>
                      <Modules />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/generate"
                  element={
                    <ProtectedRoute roles={["teacher", "admin"]}>
                      <GenerateTimetable />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/search"
                  element={
                    <ProtectedRoute>
                      <TimetableSearch />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable/view/:id"
                  element={
                    <ProtectedRoute>
                      <SemesterTimetableView />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-chat"
                  element={
                    <ProtectedRoute>
                      <AiChat />
                    </ProtectedRoute>
                  }
                />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/tutors" element={<TutorsPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </AuthInitializer>
    </Provider>
  );
}

export default App;