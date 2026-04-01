import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDark = theme === "dark";

  // Hide toggle on auth pages
  const isAuthPage = ["/auth", "/login", "/register"].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <button
      className="uiverse-toggle"
      data-theme={theme}
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      {/* Stars for dark mode */}
      <div className="toggle-stars">
        <span className="toggle-star" />
        <span className="toggle-star" />
        <span className="toggle-star" />
        <span className="toggle-star" />
        <span className="toggle-star" />
      </div>
      {/* Clouds for light mode */}
      <div className="toggle-clouds">
        <span className="toggle-cloud" />
        <span className="toggle-cloud" />
        <span className="toggle-cloud" />
      </div>
      {/* Sun/Moon celestial body */}
      <div className="toggle-celestial">
        <span className="moon-crater" />
        <span className="moon-crater" />
        <span className="moon-crater" />
        <div className="sun-rays">
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
          <span className="sun-ray" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
