export function Chip({ active = false, className = "", type = "button", ...props }) {
  const classes = ["ui-chip", active && "ui-chip--active", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-pressed={active}
      {...props}
    />
  );
}

export function ChipRow({ className = "", children }) {
  return <div className={`ui-chip-row ${className}`.trim()}>{children}</div>;
}
