export function StarterOption({ icon: Icon, label, onClick }) {
  return (
    <button type="button" className="starter-option" onClick={onClick}>
      <span className="starter-option__icon" aria-hidden="true">
        {Icon && <Icon size={18} strokeWidth={2.25} />}
      </span>
      <span className="starter-option__label">{label}</span>
    </button>
  );
}

export function StarterGrid({ className = "", children }) {
  return <div className={`starter-grid ${className}`.trim()}>{children}</div>;
}
