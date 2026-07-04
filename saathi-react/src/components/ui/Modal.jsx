import { Card } from "./Card.jsx";

export function Modal({ title, children, actions, className = "", onClose }) {
  return (
    <div className="ui-modal-overlay" onClick={onClose} role="presentation">
      <Card
        className={`ui-modal ${className}`.trim()}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "ui-modal-title" : undefined}
      >
        {title && (
          <h3 id="ui-modal-title" className="ui-modal__title">
            {title}
          </h3>
        )}
        <div className="ui-modal__body">{children}</div>
        {actions && <div className="ui-modal__actions">{actions}</div>}
      </Card>
    </div>
  );
}
