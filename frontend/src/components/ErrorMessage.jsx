import { AlertCircle, AlertTriangle, CircleCheck, Info, RotateCcw } from "lucide-react";
import { motion } from "motion/react";

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry,
  type = 'error'
}) => {
  const typeMeta = {
    error: {
      title: 'Something went wrong',
      icon: AlertTriangle,
      className: 'feedback-state--error',
    },
    warning: {
      title: 'Heads up',
      icon: AlertCircle,
      className: 'feedback-state--warning',
    },
    info: {
      title: 'FYI',
      icon: Info,
      className: 'feedback-state--info',
    },
    success: {
      title: 'All set',
      icon: CircleCheck,
      className: 'feedback-state--success',
    },
  };

  const meta = typeMeta[type] || typeMeta.error;
  const Icon = meta.icon;

  return (
    <motion.div
      className={`feedback-state ${meta.className}`}
      role="alert"
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="feedback-state__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="feedback-state__content">
        <p className="feedback-state__title">{meta.title}</p>
        <p className="feedback-state__message">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="feedback-state__retry">
          <RotateCcw size={14} />
          Retry
        </button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;
