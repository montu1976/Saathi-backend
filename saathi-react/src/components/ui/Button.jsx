export function Button({
  variant = "primary",
  size = "md",
  active = false,
  icon: Icon,
  className = "",
  type = "button",
  children,
  ...props
}) {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    size === "compact" && "ui-btn--compact",
    active && "ui-btn--active",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "compact" ? 16 : 18;

  return (
    <button type={type} className={classes} {...props}>
      {Icon && (
        <span className="ui-btn__icon" aria-hidden="true">
          <Icon size={iconSize} strokeWidth={2.25} />
        </span>
      )}
      {children}
    </button>
  );
}
