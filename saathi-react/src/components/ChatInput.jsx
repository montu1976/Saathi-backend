import { SendHorizonal } from "lucide-react";
import { Button } from "./ui/index.js";

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Share what's on your mind...",
  disabled = false
}) {
  return (
    <div className="input-area">
      <input
        value={value}
        onChange={onChange}
        onKeyDown={e => {
          if (e.key === "Enter") onSend();
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message"
      />
      <Button
        type="button"
        variant="primary"
        className="btn-send"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendHorizonal size={18} />
      </Button>
    </div>
  );
}
