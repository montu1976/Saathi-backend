/**
 * Local end-to-end test (no browser). Run while server is up:
 *   npm run build:web && npm start
 *   node scripts/test-local-flow.mjs
 */
const BASE = process.env.TEST_BASE || "http://localhost:3000";
const PRO_PHONE = process.env.TEST_PRO_PHONE || "9873333811";
const TOPIC = "astro";

const json = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `${res.status} ${path}`);
  return body;
};

const step = (n, msg) => console.log(`\n[${n}] ${msg}`);

try {
  step(1, "Health check");
  const health = await json("/health");
  console.log("   version:", health.version, "| appBase:", health.appBase);
  if (!health.version?.includes("support-v3")) {
    console.warn("   WARN: Old server? Restart after npm run build:web && npm start");
  }

  const guestId = `test-guest-${Date.now()}`;
  step(2, "Guest starts astro support");
  const { request } = await json("/support/request", {
    method: "POST",
    body: JSON.stringify({ topic: TOPIC, guestId })
  });
  console.log("   requestId:", request.id, "status:", request.status);

  step(3, "Guest sends message");
  const afterGuest = await json(`/support/request/${request.id}/message`, {
    method: "POST",
    body: JSON.stringify({ text: "Hello from guest test", guestId })
  });
  console.log("   messages:", afterGuest.request.messages.length);

  step(4, "Professional login (local dev)");
  let token;
  const healthAgain = await json("/health");
  if (healthAgain.localOnly) {
    ({ token } = await json("/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ phone: PRO_PHONE })
    }));
  } else if (process.env.TEST_OTP) {
    ({ token } = await json("/auth/whatsapp/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone: PRO_PHONE, code: process.env.TEST_OTP })
    }));
  } else {
    console.log("   Start with: npm run local — then re-run this script.");
    process.exit(0);
  }

  step(5, "Professional session ready");
  const auth = { Authorization: `Bearer ${token}` };

  step(6, "Professional inbox");
  const inbox = await json("/support/inbox", { headers: auth });
  const mine = inbox.requests.find(r => r.id === request.id);
  console.log("   inbox has request:", Boolean(mine));

  step(7, "Professional accept");
  const { request: active } = await json(`/support/request/${request.id}/accept`, {
    method: "POST",
    headers: auth
  });
  console.log("   status:", active.status);

  step(8, "Professional replies");
  const afterPro = await json(`/support/request/${request.id}/message`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ text: "Hello from professional test" })
  });
  const last = afterPro.request.messages.at(-1);
  console.log("   last message:", last?.senderType, last?.text);

  step(9, "Guest reads chat");
  const guestView = await json(
    `/support/my-active?guestId=${encodeURIComponent(guestId)}`
  );
  const proMsg = guestView.request?.messages?.find(
    m => m.senderType === "professional"
  );
  if (!proMsg) throw new Error("Guest did not see professional reply");
  console.log("   guest sees:", proMsg.text);

  console.log("\n✅ Local flow OK — test in browser: http://localhost:3000");
} catch (e) {
  console.error("\n❌", e.message);
  process.exit(1);
}
