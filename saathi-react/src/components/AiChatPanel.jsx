import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import { CHAT_STARTERS } from "../constants/preferences.js";
import { Chip, ChipRow } from "./ui/index.js";

export default function AiChatPanel({
  messages,
  loading,
  input,
  onInputChange,
  onSend,
  onStarterSelect,
  aiDisplayName,
  chatBoxRef
}) {
  const showStarters = messages.length === 0 && !loading;

  return (
    <div className="chat-section">
      <div className="chat-box" ref={chatBoxRef}>
        {showStarters && (
          <div className="chat-empty">
            <p className="chat-empty__title">What&apos;s on your mind?</p>
            <p className="chat-empty__subtitle">
              Private conversation · Not a replacement for therapy
            </p>
            <ChipRow className="chat-starters">
              {CHAT_STARTERS.map(starter => (
                <Chip key={starter} onClick={() => onStarterSelect(starter)}>
                  {starter}
                </Chip>
              ))}
            </ChipRow>
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            role={msg.role}
            content={msg.content}
            senderLabel={msg.role === "user" ? "You" : aiDisplayName}
          />
        ))}

        {loading && (
          <div className="msg-row msg-row-ai">
            <div className="msg-bubble">
              <span className="msg-sender">{aiDisplayName}</span>
              <div className="typing-indicator" aria-label="Typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        disabled={loading}
      />
    </div>
  );
}
