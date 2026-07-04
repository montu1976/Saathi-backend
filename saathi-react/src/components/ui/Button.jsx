export function Button({
  variant = "primary",
  size = "md",
  active = false,
  className = "",
  type = "button",
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

  return <button type={type} className={classes} {...props} />;
}
