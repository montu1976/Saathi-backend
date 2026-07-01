function PrivacyPolicy({ onBack }) {
  return (
    <div className="privacy-page">
      <button type="button" className="privacy-back btn-ghost btn-compact" onClick={onBack}>
        ← Back
      </button>
      <h2 className="privacy-title">Privacy Policy</h2>
      <p className="privacy-updated">Last updated: June 2026</p>

      <section>
        <h3>What Saathi is</h3>
        <p>
          Saathi is an emotional support companion for Indian users. It offers AI chat
          and optional connections to human professionals (lawyers, tarot readers,
          astrologers). Saathi is not a hospital, clinic, or emergency service.
        </p>
      </section>

      <section>
        <h3>Information we collect</h3>
        <ul>
          <li><strong>Account:</strong> email and password, or phone number for WhatsApp login</li>
          <li><strong>Profile (optional):</strong> display name and city</li>
          <li><strong>Chats:</strong> messages you send to Saathi AI and to professionals</li>
          <li><strong>Guest use:</strong> a random guest ID stored on your device</li>
          <li><strong>Push (if enabled):</strong> browser/device subscription for notifications</li>
        </ul>
      </section>

      <section>
        <h3>Peer-to-peer chats</h3>
        <p>
          If you opt in, Saathi may connect you with other online users who appear
          to share similar topics (e.g. job stress, relationships, marriage). You
          can choose to stay anonymous. <strong>Saathi is not responsible for any
          chat, advice, or conduct between two users.</strong> Use your own judgment
          and leave the chat anytime from the Peer Chat box.
        </p>
      </section>

      <section>
        <h3>How we use it</h3>
        <ul>
          <li>To run your account and save conversations (logged-in users)</li>
          <li>To match you with other opted-in users on similar topics (if you consent)</li>
          <li>To connect you with a professional you choose via Guide</li>
          <li>To send OTP codes on WhatsApp when you log in with phone</li>
          <li>To improve replies within your active chat session</li>
        </ul>
        <p>We do not sell your personal data to advertisers.</p>
      </section>

      <section>
        <h3>AI &amp; professional chats</h3>
        <p>
          AI replies are generated automatically and may be wrong or incomplete.
          They are not medical, legal, or financial advice. For human help, use the
          Guide menu. In a crisis, contact someone you trust or Kiran Helpline
          (India): 1800-599-0019.
        </p>
      </section>

      <section>
        <h3>Storage &amp; security</h3>
        <p>
          Data is stored on our servers (hosted cloud). Passwords are hashed.
          Chats for logged-in users are saved to your account. Guest chats may be
          kept temporarily in server memory and are not tied to a permanent account.
        </p>
      </section>

      <section>
        <h3>Your choices</h3>
        <ul>
          <li>Use Saathi as a guest without creating an account</li>
          <li>Log out at any time from the profile menu</li>
          <li>Request account or data deletion by contacting us (see below)</li>
        </ul>
      </section>

      <section>
        <h3>Children</h3>
        <p>Saathi is not intended for users under 13.</p>
      </section>

      <section>
        <h3>Contact</h3>
        <p>
          For privacy questions or account deletion, email{" "}
          <a href="mailto:support.saathi@gmail.com">support.saathi@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
