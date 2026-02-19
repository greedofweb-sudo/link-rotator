# 🔗 Affiliate Link Rotator — Setup Guide

Generates a **brand new short link every single click**, so your affiliate
destination is always behind a fresh, unrecognized URL.

---

## How It Works

```
Visitor clicks your master link
        ↓
Your server generates a NEW short link (via API)
        ↓
Visitor is redirected through that fresh short link
        ↓
They land on your affiliate offer
```

Every click = unique short URL. Never the same link twice.

---

## Step 1 — Install Node.js

Download from https://nodejs.org (LTS version recommended).

---

## Step 2 — Choose a Short Link Provider & Get API Key

### Option A: Short.io (Recommended — generous free tier)
1. Sign up at https://short.io
2. Go to **Settings → API** and copy your API key
3. Note your domain (e.g. `go.yourdomain.com` or their free shared domain)

### Option B: Rebrandly (Free tier available)
1. Sign up at https://rebrandly.com
2. Go to **Account → API** and copy your API key
3. Note your branded domain

### Option C: Bitly (Free tier — 10 links/month limit, not ideal)
1. Sign up at https://bitly.com
2. Go to **Settings → Developer Settings → API** and generate a token
3. Find your Group GUID in account settings

---

## Step 3 — Configure server.js

Open `server.js` and fill in the CONFIG section at the top:

```js
const CONFIG = {
  DESTINATION_URL: "https://your-actual-affiliate-link.com", // ← your link
  PROVIDER: "shortio",   // ← "shortio" | "rebrandly" | "bitly"
  PORT: 3000,

  SHORTIO: {
    API_KEY: "sk_xxxxxxxx",         // ← from Short.io dashboard
    DOMAIN: "go.yourdomain.com",    // ← your Short.io domain
  },
  // ... fill in whichever provider you chose
};
```

---

## Step 4 — Run the Server

```bash
# In the link-rotator folder:
node server.js
```

You'll see:
```
✅ Link Rotator running!
🔗 Your master link: http://localhost:3000
```

---

## Step 5 — Share Your Master Link

Share `http://localhost:3000` (or your server's public IP/domain if hosted).

Every person who clicks it gets a **different short link** — the platform
never sees the same URL twice.

---

## Hosting Online (So It Works 24/7)

To make your master link public and always-on:

| Option | Cost | Ease |
|--------|------|------|
| **Railway.app** | Free tier | Very easy — just upload folder |
| **Render.com** | Free tier | Easy |
| **VPS (DigitalOcean/Vultr)** | ~$4/mo | More control |

On Railway/Render: connect your GitHub repo and it auto-deploys.
Your master link becomes something like `https://your-app.railway.app`.

---

## Logs

Every click is saved to `clicks.log`:
```
[2024-01-15T10:23:44.123Z] IP: 123.456.789.0 → https://short.io/abc123
[2024-01-15T10:24:01.456Z] IP: 98.765.432.1  → https://short.io/xyz789
```

---

## Tips to Further Avoid Flagging

- Use a **custom domain** on your shortener (not `bit.ly` — those are often blocked)
- Add a **buffer/bridge page** between the short link and your affiliate offer
- Rotate your **destination URL** too if you have multiple offer URLs
- Short.io and Rebrandly both support custom domains on free/cheap plans
