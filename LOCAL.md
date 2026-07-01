# Test Saathi locally (one PC, two browsers)

No Wi‑Fi or phone needed for this test. Both guest and professional use **http://localhost:3000**.

## 1. Start the app

```powershell
cd C:\Users\bindiya\Desktop\Saathi
npm run local
```

This forces **localhost** links (ignores production `APP_URL` in `.env` while testing).

Optional in `.env` for local only:

```env
LOCAL_ONLY=1
APP_URL=http://localhost:3000
```

Wait for:

```text
Server running on http://localhost:3000 (2026-05-26-support-v3)
```

Open **only** this URL: **http://localhost:3000**

Under the title you should see: `server 2026-05-26-support-v3` (not OLD-REMOTE-SERVER).

## 2. Admin — set professional phone

1. Click **Admin Panel**
2. Admin key: `change-me-admin-key` (unless you changed `ADMIN_KEY` in `.env`)
3. Set **Astro** to the phone you will use for the professional (e.g. `9873333811`)
4. Save

## 3. Browser A — guest (client)

1. **Continue as Guest**
2. Click **Astro**
3. Type in **“Message the professional here…”** (green box) — not Saathi AI at the bottom
4. Send: `Hi, I need help`

## 4. Browser B — professional (incognito or other browser)

1. Open **http://localhost:3000**
2. Enter the **same phone** as in Admin for Astro (e.g. `9873333811`)
3. Click **Local dev login (no OTP)** — only appears when running `npm run local`
   - Or use WhatsApp OTP if you prefer
4. Under **Professional Notifications** → **Accept**
5. Reply in **“Reply to your client here…”**

## 5. Browser A — check reply

Within a few seconds the guest should see the professional’s message in the **green Professional Chat** box.

---

## Automated API test

With server running:

```powershell
# Terminal 2 — request OTP first, then:
$env:TEST_OTP="123456"   # code from server log
node scripts/test-local-flow.mjs
```

## Common mistakes

| Problem | Fix |
|--------|-----|
| OLD-REMOTE-SERVER in banner | Stop other servers; use `npm run local` and port 3000 only |
| Guest uses bottom Saathi AI box | Use only the green **Professional Chat** input |
| Professional uses Guest | Professional must **WhatsApp login** |
| No Accept button | Astro phone in Admin must match login phone |
| Same person as guest and pro for Astro | Use different topics or different phones |

## Next: deploy (any network)

See `DEPLOY.md` after local test passes.
