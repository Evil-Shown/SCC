const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeMap = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  };

  return (
    <div className="uiverse-loader fade-in" role="status" aria-label="Loading">
      <div className={`uiverse-spinner ${sizeMap[size] || ''}`}>
        <div className="orbit" />
        <div className="orbit" />
        <div className="orbit" />
      </div>
      {text && <p className="uiverse-loader-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
