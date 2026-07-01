# Deploy Saathi to Render (production)

Do this **after** local test in `LOCAL.md` works.

## What you deploy

One service serves **both** API and React UI on the same URL (required for WhatsApp links and cookies).

## 1. Push code to GitHub

Ensure `saathi-react/dist` is **not** required in git — Render will build on deploy.

## 2. Render web service

**Option A — Blueprint (recommended):** repo includes `render.yaml`. On [Render](https://render.com) → **New** → **Blueprint** → connect `montu1976/Saathi-backend` → apply. Then set secret env vars in the dashboard.

**Option B — Manual web service:**

- **Build command:** `npm install && npm install --prefix saathi-react && npm install --prefix saathi-pro && npm run build:web`
- **Start command:** `npm start`
- **Environment variables** (Render dashboard → Environment):

| Variable | Example |
|----------|---------|
| `OPENAI_API_KEY` | your key |
| `ADMIN_KEY` | strong secret |
| `APP_URL` | `https://YOUR-SERVICE.onrender.com` |
| `TWILIO_ACCOUNT_SID` | … |
| `TWILIO_AUTH_TOKEN` | … |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+…` |

**Important:** `APP_URL` must be your **public Render URL** (https), not localhost.

## 3. After deploy

1. Open `https://YOUR-SERVICE.onrender.com`
2. Banner should show `server 2026-05-26-support-v3` and your Render URL
3. Guest and professional can be on **any network** — same public URL

## 4. WhatsApp

WhatsApp links use `APP_URL`. Professionals tap the link on their phone → login → Accept → chat.

## 5. App Store & Google Play

After the site works on Render, follow **[STORE.md](./STORE.md)** to build iOS and Android apps with Capacitor.
