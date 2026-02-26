const EmptyState = ({ 
  icon = '📭',
  title = 'No items found',
  description = 'Get started by creating your first item',
  action,
  actionText = 'Create New'
}) => {
  return (
    <div className="uiverse-empty-state fade-in" style={{ position: 'relative' }}>
      {/* Floating particles */}
      <div className="uiverse-empty-particles">
        <div className="uiverse-particle" />
        <div className="uiverse-particle" />
        <div className="uiverse-particle" />
        <div className="uiverse-particle" />
      </div>
      {/* Icon with animated rings */}
      <div className="uiverse-empty-icon-wrap">
        <div className="uiverse-empty-ring" />
        <div className="uiverse-empty-ring" />
        <div className="uiverse-empty-ring" />
        <span className="uiverse-empty-emoji">{icon}</span>
      </div>
      <h3 className="uiverse-empty-title">{title}</h3>
      <p className="uiverse-empty-desc">{description}</p>
      {action && (
        <button onClick={action} className="btn-uiverse">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
