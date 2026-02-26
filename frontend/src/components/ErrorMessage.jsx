import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry,
  type = 'error'
}) => {
  const typeStyles = {
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
    success: 'alert-success'
  };

  return (
    <div className={`alert ${typeStyles[type]} fade-in`} role="alert">
      <AlertCircle size={20} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="btn btn-sm btn-outline"
          style={{ marginLeft: 'auto' }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
