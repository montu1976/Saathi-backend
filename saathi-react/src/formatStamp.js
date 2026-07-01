export function formatChatStamp(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  } catch {
    return "";
  }
}

export function formatChatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });
  } catch {
    return "";
  }
}
