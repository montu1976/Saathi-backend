# Deploy Saathi to Render (production)

Do this **after** local test in `LOCAL.md` works.

## What you deploy

One service serves **both** API and React UI on the same URL (required for WhatsApp links and cookies).

## 1. Push code to GitHub

Ensure `saathi-react/dist` is **not** required in git — Render will build on deploy.

## 2. Render web service (free — manual, no Blueprint)

1. [Render](https://render.com) → **New +** → **Web Service**
2. Connect GitHub repo → branch `main`
3. **Instance type:** Free
4. Settings:

| Field | Value |
|-------|--------|
| **Runtime** | Node |
| **Build Command** | `npm install && npm install --prefix saathi-react && npm install --prefix saathi-pro && npm run build:web` |
| **Start Command** | `npm start` |

**Important:** Build Command must start with `npm`, **not** `yarn`. If you see `yarn npm install` in the logs, delete `yarn` from the field and save.

5. **Environment** → add `NODE_VERSION` = `20` (repo also has `.nvmrc`).
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

## Troubleshooting

| Error in logs | Fix |
|---------------|-----|
| `yarn run ... error Command "npm" not found` | Build Command has `yarn` at the start by mistake. Use only the `npm install && ...` command above. |
| `don't have access to your repo` | Render → Account Settings → GitHub → grant access to the repo. |
| Blank page after deploy | Build failed or `dist/` missing — check **Logs** tab for build errors. |
| Chat/API errors | Set `APP_URL` to your exact `https://....onrender.com` URL and redeploy. |
