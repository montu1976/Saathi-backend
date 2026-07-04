import {
  AI_NAME_PRESETS,
  GENDER_OPTIONS,
  LANGUAGE_OPTIONS
} from "../constants/preferences.js";
import { Button, Chip, ChipRow } from "./ui/index.js";

export default function ProfileMenu({
  user,
  isGuest,
  guestId,
  getDisplayName,
  getSessionLabel,
  getAvatarInitial,
  getAiDisplayName,
  professionalTopics,
  profileName,
  profileCity,
  profileMsg,
  aiCompanionName,
  customAiName,
  userGender,
  userLanguage,
  peerSettings,
  peerError,
  hasPassword,
  showPasswordForm,
  currentPassword,
  newPassword,
  passwordError,
  passwordMsg,
  chatSessions,
  activeChatId,
  onProfileNameChange,
  onProfileCityChange,
  onSaveProfile,
  onSaveAiName,
  onResetAiName,
  onCustomAiNameChange,
  onSaveUserPrefs,
  onPeerSettingsUpdate,
  onPeerError,
  onShowPasswordForm,
  onHidePasswordForm,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onChangePassword,
  onStartNewChat,
  onLoadChatSession,
  onLogin,
  onLogout,
  apiRequest,
  getAuthHeaders
}) {
  return (
    <div className="profile-menu">
      <div className="footer-menu-section">
        <div className="footer-menu-title">Profile</div>
        <div className="footer-profile-row">
          <div className="footer-avatar footer-avatar-lg">{getAvatarInitial()}</div>
          <div className="footer-profile-info">
            <div className="footer-profile-name">{getDisplayName()}</div>
            <div className="footer-profile-type">{getSessionLabel()}</div>
            {professionalTopics.length > 0 && (
              <div className="footer-pro-tag">
                Pro: {professionalTopics.join(", ")} — use{" "}
                <a href="/pro/" className="pro-link">
                  Saathi Partner
                </a>
              </div>
            )}
            {profileCity && (
              <div className="footer-profile-type">{profileCity}</div>
            )}
          </div>
        </div>
        <div className="footer-profile-form">
          <input
            placeholder="Your name (optional)"
            value={profileName}
            onChange={e => onProfileNameChange(e.target.value)}
          />
          <input
            placeholder="City (optional)"
            value={profileCity}
            onChange={e => onProfileCityChange(e.target.value)}
          />
          <Button variant="toolbar" onClick={onSaveProfile}>
            Save profile
          </Button>
          {profileMsg && <div className="auth-info">{profileMsg}</div>}
        </div>

        <div className="footer-menu-section ai-name-section">
          <div className="footer-menu-title">
            AI friend name ({getAiDisplayName()})
          </div>
          <ChipRow>
            {AI_NAME_PRESETS.map(name => (
              <Chip
                key={name}
                active={aiCompanionName === name}
                onClick={() => onSaveAiName(name)}
              >
                {name}
              </Chip>
            ))}
          </ChipRow>
          <div className="ai-name-custom-row">
            <input
              placeholder="Custom (8 chars max)"
              maxLength={8}
              value={customAiName}
              onChange={e => onCustomAiNameChange(e.target.value)}
            />
            <Button variant="toolbar" onClick={() => onSaveAiName(customAiName)}>
              Set
            </Button>
          </div>
          <Button variant="ghost" size="compact" onClick={onResetAiName}>
            Reset to Saathi
          </Button>
        </div>

        <div className="footer-menu-section ai-name-section">
          <div className="footer-menu-title">You are</div>
          <ChipRow>
            {GENDER_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                active={userGender === opt.value}
                onClick={() => onSaveUserPrefs({ gender: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </ChipRow>
          <div className="footer-menu-title">Reply language</div>
          <ChipRow>
            {LANGUAGE_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                active={userLanguage === opt.value}
                onClick={() => onSaveUserPrefs({ language: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </ChipRow>
        </div>

        <div className="footer-menu-section peer-settings-section">
          <div className="footer-menu-title">Connect with others</div>
          <label className="peer-check">
            <input
              type="checkbox"
              checked={peerSettings.contactOk}
              onChange={async e => {
                const contactOk = e.target.checked;
                try {
                  const data = await apiRequest("/peer/settings", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      ...getAuthHeaders()
                    },
                    body: JSON.stringify({
                      guestId: !user ? guestId : undefined,
                      contactOk,
                      anonymous: peerSettings.anonymous
                    })
                  });
                  onPeerSettingsUpdate(data.settings);
                  localStorage.setItem("saathi_peer_consent_asked", "1");
                } catch (err) {
                  onPeerError(err.message);
                }
              }}
            />
            OK to be contacted by other users
          </label>
          <label className="peer-check">
            <input
              type="checkbox"
              checked={peerSettings.anonymous}
              onChange={async e => {
                const anonymous = e.target.checked;
                try {
                  const data = await apiRequest("/peer/settings", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      ...getAuthHeaders()
                    },
                    body: JSON.stringify({
                      guestId: !user ? guestId : undefined,
                      contactOk: peerSettings.contactOk,
                      anonymous
                    })
                  });
                  onPeerSettingsUpdate(data.settings);
                } catch (err) {
                  onPeerError(err.message);
                }
              }}
            />
            Stay anonymous in peer chat
          </label>
          {peerError && <div className="auth-error">{peerError}</div>}
        </div>
      </div>

      {user && hasPassword && (
        <div className="footer-menu-section">
          {!showPasswordForm ? (
            <button
              type="button"
              className="footer-menu-item"
              onClick={onShowPasswordForm}
            >
              Change password
            </button>
          ) : (
            <div className="footer-password-form">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={e => onCurrentPasswordChange(e.target.value)}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => onNewPasswordChange(e.target.value)}
              />
              <div className="footer-password-actions">
                <Button variant="toolbar" onClick={onChangePassword}>
                  Save
                </Button>
                <Button variant="toolbar" onClick={onHidePasswordForm}>
                  Cancel
                </Button>
              </div>
              {passwordError && <div className="auth-error">{passwordError}</div>}
              {passwordMsg && <div className="auth-info">{passwordMsg}</div>}
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="footer-menu-section">
          <div className="footer-menu-title">Recent chats</div>
          <button type="button" className="footer-menu-item" onClick={onStartNewChat}>
            + New chat
          </button>
          {chatSessions.length === 0 && (
            <div className="footer-menu-empty">No saved chats yet</div>
          )}
          {chatSessions.map(session => (
            <button
              key={session.id}
              type="button"
              className={`footer-chat-item ${activeChatId === session.id ? "active" : ""}`}
              onClick={() => onLoadChatSession(session.id)}
            >
              <span className="footer-chat-title">{session.title}</span>
              <span className="footer-chat-preview">{session.preview}</span>
            </button>
          ))}
        </div>
      )}

      <div className="footer-menu-section footer-menu-actions">
        {isGuest && (
          <button type="button" className="footer-menu-item" onClick={onLogin}>
            Login
          </button>
        )}
        {user && (
          <button type="button" className="footer-menu-item footer-logout" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
