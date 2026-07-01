# Saathi Partner — Professional App

Saathi Partner is the companion app for lawyers, tarot readers, and astrologers registered on Saathi.

## Features

- **Phone login** — same WhatsApp OTP flow as Saathi
- **In-app notifications** — web push when a client requests your topic (no WhatsApp alerts by default)
- **Request inbox** — New, Active, and 30-day History tabs
- **Accept / Decline** — declining sends the client: *"The professional is busy at the moment. Please connect later."*
- **Live chat** — message clients after accepting
- **Profile** — display name, bio, photo, logout
- **Chat retention** — transcripts kept for at least 30 days on the server

### Suggested future features

- Online / away status so clients know availability
- Quick reply templates (e.g. "Please share your date of birth")
- Daily summary of requests handled
- Native iOS/Android build via Capacitor (same as main Saathi app)

## URLs

| Environment | Saathi (users) | Saathi Partner |
|-------------|----------------|------------|
| Local       | http://localhost:3000 | http://localhost:3000/pro/ |
| Production  | `APP_URL` | `APP_URL/pro/` |

Dev-only Vite server: `npm run dev:pro` → http://localhost:5174/pro/

## Setup

1. Add the professional's phone in **Admin → Professionals** (main Saathi app) or via `PUT /admin/professionals`.
2. Professional opens **Saathi Partner** and logs in with that same phone number.
3. Allow **notifications** when prompted (required for pop-up alerts).
4. On mobile: open `/pro/` in Chrome/Safari → **Add to Home Screen** for a PWA-style app.

## Environment variables

Copy `saathi-pro/.env.example` to `saathi-pro/.env` for local dev:

```
VITE_API_BASE=http://localhost:3000
VITE_VAPID_PUBLIC_KEY=<same as server VAPID_PUBLIC_KEY>
```

Server `.env` (root):

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:support.saathi@gmail.com
APP_URL=https://your-saathi-app.example.com
```

Set `NOTIFY_PRO_VIA_WHATSAPP=1` only if you still want Twilio WhatsApp alerts in addition to push.

## Build & run

```powershell
cd Saathi
npm install
npm install --prefix saathi-pro
npm run local
```

This builds both apps and serves them from one server (`/` = Saathi, `/pro/` = Saathi Partner).

## Admin (moved from Saathi AI)

Admin is now in **Saathi Partner** only:

1. Open `/pro/` → **Admin** tab
2. Enter your `ADMIN_KEY` from server `.env`
3. **Load dashboard** to see:
   - Manage **multiple phone numbers** per category (Lawyers, Tarot, Astro)
   - Who is **online** (users and professionals)
   - **Peer chats** — who is chatting with whom
   - Support requests

When a client picks a Guide topic, they are connected **randomly** to one of the online professionals in that category (or any pro in the pool if none are online).

## Professional features

- **Online / Away** toggle in the header (clients see counts in Guide dropdown)
- **Quick reply templates** — edit in Profile, tap chips while chatting
- **Native apps** — Capacitor Android/iOS:

```powershell
cd saathi-pro
npm run build:mobile
npm run cap:sync
npm run cap:android   # or cap:ios on Mac
```

Set `VITE_API_BASE` to your production API URL in `saathi-pro/.env` before mobile builds.

## How it links to Saathi

1. User picks **Guide → Lawyer / Tarot / Astro** in Saathi.
2. Server creates a support request and sends **push** to all devices logged in as that professional's phone.
3. Professional sees a toast in Saathi Partner, taps **Accept** or **Decline**.
4. Client's Saathi screen updates automatically (polling). If declined, they see the busy message.
