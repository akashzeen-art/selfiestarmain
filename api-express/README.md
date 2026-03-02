# Express API for Vercel (currently disabled)

This folder is **renamed from `api`** so Vercel only builds the frontend. Building the full Express server as a serverless function was causing the deployment to hang after "vite build".

**To re-enable the API on Vercel:**
1. Rename this folder back to `api`: `mv api-express api`
2. In `vercel.json`, add back the API route and functions config (see git history).
3. Push and deploy. If the build still hangs, host the API elsewhere (e.g. Railway, Render) and point the frontend to that URL.

**To run the full app locally:** The dev server uses the Express app from `server/`; this folder is only for Vercel serverless. No need to rename for local dev.
