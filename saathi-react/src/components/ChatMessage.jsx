export default function ChatMessage({ role, content, senderLabel }) {
  const isUser = role === "user";

  return (
    <div className={`msg-row ${isUser ? "msg-row-user" : "msg-row-ai"}`}>
      <div className="msg-bubble">
        <span className="msg-sender">{senderLabel}</span>
        <span className="msg-text">{content}</span>
      </div>
    </div>
  );
}
