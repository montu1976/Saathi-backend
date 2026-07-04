import { Bot, UserRound } from "lucide-react";

export default function ChatMessage({ role, content, senderLabel }) {
  const isUser = role === "user";

  return (
    <div className={`msg-row ${isUser ? "msg-row-user" : "msg-row-ai"}`}>
      {!isUser && (
        <div className="msg-avatar msg-avatar-ai" aria-hidden="true">
          <Bot size={16} strokeWidth={2.25} />
        </div>
      )}
      <div className="msg-bubble">
        <span className="msg-sender">{senderLabel}</span>
        <span className="msg-text">{content}</span>
      </div>
      {isUser && (
        <div className="msg-avatar msg-avatar-user" aria-hidden="true">
          <UserRound size={16} strokeWidth={2.25} />
        </div>
      )}
    </div>
  );
}
