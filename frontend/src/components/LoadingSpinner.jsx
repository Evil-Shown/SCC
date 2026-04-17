import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

const LoadingSpinner = ({ size = "md", text = "Loading...", subtext = "Please wait while we prepare everything." }) => {
  const sizeMap = {
    sm: {
      className: "loading-state--sm",
      iconSize: 14,
    },
    md: {
      className: "loading-state--md",
      iconSize: 16,
    },
    lg: {
      className: "loading-state--lg",
      iconSize: 18,
    },
  };

  const config = sizeMap[size] || sizeMap.md;

  return (
    <motion.div
      className={`loading-state ${config.className}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="loading-state__visual" aria-hidden="true">
        <motion.span
          className="loading-state__halo"
          animate={{ scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="loading-state__ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="loading-state__core"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={config.iconSize} />
        </motion.span>
      </div>
      <div className="loading-state__copy">
        {text && <p className="loading-state__text">{text}</p>}
        {subtext && <p className="loading-state__subtext">{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;
