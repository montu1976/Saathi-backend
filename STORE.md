# Saathi — App Store & Google Play

Saathi is a **web app wrapped with Capacitor** for iOS and Android. The phone app loads your React UI locally and talks to your **live HTTPS server** (Render).

## Before you start

1. Deploy the backend + web to Render — see [DEPLOY.md](./DEPLOY.md).
2. Confirm `https://YOUR-URL.onrender.com` works in a phone browser.
3. Have a **privacy policy** URL (required by both stores). Host a simple page or use Notion/Google Sites.

| Store | Account | Cost |
|-------|---------|------|
| Google Play | [Google Play Console](https://play.google.com/console) | $25 one-time |
| Apple App Store | [Apple Developer](https://developer.apple.com/programs/) | $99/year |

---

## One-time setup (already in repo)

```powershell
cd saathi-react
npm install
```

Capacitor config: `saathi-react/capacitor.config.json`  
App ID: `com.saathi.app` (change before publish if you want your own bundle ID).

---

## App icons (required for stores)

1. Create a **1024×1024 PNG** logo (warm, no transparency for iOS).
2. Save as `saathi-react/resources/icon.png`.
3. Optional splash: `saathi-react/resources/splash.png` (2732×2732).
4. Generate all sizes:

```powershell
cd saathi-react
npm run assets:generate
```

---

## Build the mobile app

1. Copy env file and set your **live** URL:

```powershell
cd saathi-react
copy .env.mobile.example .env.mobile
# Edit .env.mobile → VITE_API_BASE=https://YOUR-SERVICE.onrender.com
```

2. Build and sync native projects:

```powershell
npm run build:mobile
npx cap sync
```

Or from repo root:

```powershell
npm run cap:sync
```

---

## Android (Google Play) — can build on Windows

### Requirements

- [Android Studio](https://developer.android.com/studio) (latest)
- JDK 17+

### Open project

```powershell
cd saathi-react
npx cap open android
```

In Android Studio:

1. **Build → Generate Signed Bundle / APK** → **Android App Bundle (.aab)** for Play Store.
2. Create a keystore (save passwords safely — you need them for every update).
3. Test on emulator or USB device: Run ▶.

### Play Console checklist

- App name: **Saathi**
- Short description: emotional support companion for Indian users
- Category: Health & Fitness or Lifestyle
- Privacy policy URL: `https://YOUR-SERVICE.onrender.com/privacy.html`
- Content rating questionnaire
- Screenshots: phone 1080×1920 or similar (2–8 images)
- Upload `.aab` to **Production** or **Internal testing** first

---

## iOS (App Store) — requires a Mac

You can generate the `ios/` folder on Windows, but **build and upload need Xcode on macOS**.

### On Mac

```bash
cd saathi-react
npm run build:mobile
npx cap sync ios
npx cap open ios
```

In Xcode:

1. Select target **Saathi** → **Signing & Capabilities** → your Apple Team.
2. Set **Bundle Identifier** (e.g. `com.saathi.app`).
3. Product → Archive → Distribute to **App Store Connect**.

### App Store Connect checklist

- Privacy policy URL: `https://YOUR-SERVICE.onrender.com/privacy.html`
- App description + keywords
- Screenshots: 6.7" and 6.5" iPhone sizes
- Age rating (likely 12+ due to emotional/mental health themes)
- **Review notes:** explain Saathi is peer-style emotional support, not a replacement for therapy; crisis line shown for self-harm keywords

---

## Update the app after changes

```powershell
cd saathi-react
npm run build:mobile
npx cap sync
```

Then rebuild in Android Studio / Xcode and submit a new version.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank screen in app | `npm run build:mobile` then `npx cap sync`; check `dist/` exists |
| API / network errors | Set `VITE_API_BASE` in `.env.mobile` to **https** Render URL, rebuild |
| CORS errors | Server already uses `cors()` — ensure `APP_URL` on Render matches your domain |
| WhatsApp links | Use public `APP_URL` on Render, not localhost |

---

## Optional: change bundle ID

Edit `appId` in `saathi-react/capacitor.config.json`, then:

```powershell
npx cap sync
```

Use the same ID in Apple Developer and Google Play Console.
