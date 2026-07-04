import { Button } from "./ui/index.js";

export default function AuthCard({
  authProvider,
  authMode,
  email,
  password,
  phone,
  otp,
  otpStage,
  whatsappConfigured,
  authError,
  authInfo,
  hasProfessionalDeepLink,
  onProviderChange,
  onEmailChange,
  onPasswordChange,
  onPhoneChange,
  onOtpChange,
  onAuth,
  onToggleAuthMode,
  onRequestOtp,
  onVerifyOtp,
  onGuest,
  onPrivacy
}) {
  return (
    <div className="auth-card auth-card-compact">
      <p className="mode-info auth-tagline">
        Login to save chats, or continue as guest.
      </p>

      <div className="auth-tabs">
        <Button
          variant={authProvider === "email" ? "primary" : "ghost"}
          size="compact"
          active={authProvider === "email"}
          aria-pressed={authProvider === "email"}
          onClick={() => onProviderChange("email")}
        >
          Email
        </Button>
        <Button
          variant={authProvider === "whatsapp" ? "primary" : "ghost"}
          size="compact"
          active={authProvider === "whatsapp"}
          aria-pressed={authProvider === "whatsapp"}
          onClick={() => onProviderChange("whatsapp")}
        >
          WhatsApp {whatsappConfigured ? "✓" : ""}
        </Button>
      </div>

      {authProvider === "email" && (
        <div className="auth-row">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => onPasswordChange(e.target.value)}
          />
          <Button variant="primary" size="compact" onClick={onAuth}>
            {authMode === "login" ? "Login" : "Create Account"}
          </Button>
          <Button variant="ghost" size="compact" onClick={onToggleAuthMode}>
            {authMode === "login" ? "Need account?" : "Have account?"}
          </Button>
        </div>
      )}

      {authProvider === "whatsapp" && (
        <div className="auth-row auth-row-phone">
          <input
            className="input-phone"
            type="tel"
            inputMode="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={e => onPhoneChange(e.target.value)}
          />
          {otpStage === "verify" && (
            <input
              className="input-otp"
              placeholder="OTP"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => onOtpChange(e.target.value)}
            />
          )}
          {otpStage === "request" ? (
            <Button variant="primary" size="compact" onClick={onRequestOtp}>
              Send OTP
            </Button>
          ) : (
            <Button variant="primary" size="compact" onClick={onVerifyOtp}>
              Verify OTP
            </Button>
          )}
        </div>
      )}

      {authError && <p className="auth-error auth-msg">{authError}</p>}
      {authInfo && !authError && <p className="auth-info auth-msg">{authInfo}</p>}
      {hasProfessionalDeepLink && (
        <p className="auth-info auth-msg">
          Professional link — use WhatsApp login with your assigned number.
        </p>
      )}
      {!hasProfessionalDeepLink && (
        <Button variant="secondary" size="compact" onClick={onGuest}>
          Continue as Guest
        </Button>
      )}

      <button type="button" className="privacy-link" onClick={onPrivacy}>
        Privacy Policy
      </button>
    </div>
  );
}
