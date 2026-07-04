import { GraduationCap, Home, Heart, Moon, Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import { CHAT_STARTERS } from "../constants/preferences.js";
import { StarterGrid, StarterOption } from "./ui/index.js";

const STARTER_ICONS = {
  graduation: GraduationCap,
  home: Home,
  heart: Heart,
  moon: Moon
};

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
            <div className="chat-empty__hero" aria-hidden="true">
              <Sparkles size={28} strokeWidth={2} />
            </div>
            <p className="chat-empty__title">What&apos;s on your mind?</p>
            <p className="chat-empty__subtitle">
              Tap a topic to start — private &amp; judgment-free
            </p>
            <StarterGrid>
              {CHAT_STARTERS.map(starter => {
                const Icon = STARTER_ICONS[starter.icon];
                return (
                  <StarterOption
                    key={starter.label}
                    icon={Icon}
                    label={starter.label}
                    onClick={() => onStarterSelect(starter.label)}
                  />
                );
              })}
            </StarterGrid>
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
            <div className="msg-avatar msg-avatar-ai" aria-hidden="true">
              <Sparkles size={16} strokeWidth={2.25} />
            </div>
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
