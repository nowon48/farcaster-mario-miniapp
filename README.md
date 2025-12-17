# Farcaster Mario — Mini App (template)

This repo packages a simple Mario-style mini game as a **Farcaster Mini App**.

## What you get
- ✅ `/.well-known/farcaster.json` manifest (required by Farcaster clients)  
- ✅ Uses **@farcaster/miniapp-sdk** via CDN (esm.sh)
- ✅ Calls `sdk.actions.ready()` to hide the splash screen (required)
- ✅ `sdk.context` used to show user FID/username when opened inside Farcaster
- ✅ Optional Express backend with `/api/score` + `/api/leaderboard`

## 1) Run locally (web browser)
```bash
npm i
npm run dev
# open http://localhost:3000
```

## 2) Deploy (production)
You must deploy to an **HTTPS domain**. Mini Apps require HTTPS and a stable domain. citeturn2view1turn3search1

### Recommended: Nginx reverse proxy + Let's Encrypt
1) Copy project to your VPS:
```bash
sudo mkdir -p /opt/farcaster-mario
sudo chown -R $USER:$USER /opt/farcaster-mario
# upload files here
```

2) Start the app:
```bash
cd /opt/farcaster-mario
npm i
npm run start
```

3) Put Nginx in front (example server block):
- proxy to `http://127.0.0.1:3000`
- serve your domain

4) Add SSL:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN
```

## 3) Configure the manifest
Your manifest lives at:

`https://YOUR_DOMAIN/.well-known/farcaster.json` citeturn2view0turn2view1

### IMPORTANT: You must add `accountAssociation`
Farcaster spec requires `accountAssociation` to verify the domain belongs to your Farcaster account. citeturn2view0turn2view2

Two easy ways to generate it:
- Farcaster Manifest Tool (farcaster.xyz → Developers → Manifest Tool) citeturn2view2
- Base Build Preview Tool (Account Association) citeturn2view2

Paste the generated `accountAssociation` into `public/.well-known/farcaster.json` and redeploy.

## 4) Test inside Farcaster
- Open your HTTPS URL inside Warpcast / Farcaster client.
- You should see:
  - Environment: miniapp
  - User: @username (or FID)
- If you forget to call `sdk.actions.ready()`, you'll get an infinite loading splash. citeturn3search7

## Notes
- The backend leaderboard is in-memory for MVP. Replace with Postgres for real usage.
- Score verification is not implemented (users could fake scores). Add signed proof later.
