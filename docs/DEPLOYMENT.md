# Jarvis Zero-Cost Deployment Guide

Follow this guide to deploy Jarvis with **$0 hosting cost and no credit card required**.

## Prerequisites
- A GitHub account (hosting `https://github.com/siddiqesq2004/jarvis.git`)
- A free Vercel account ([vercel.com](https://vercel.com))
- A free Supabase account ([supabase.com](https://supabase.com))
- A free Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

---

## Step 1: Database Setup on Supabase ($0 Free Tier)
1. Log in to [Supabase](https://supabase.com) and click **New Project** (Choose free plan).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/migrations/20261022000001_initial_schema.sql` and click **Run**.
4. Go to **Project Settings -> API** and copy:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` -> `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Get Free AI Inference Key ($0 Free Tier)
1. Go to [Google AI Studio](https://aistudio.google.com).
2. Click **Get API key** -> **Create API key**.
3. Copy your key -> `GEMINI_API_KEY`. (Free quota: 1,500 requests/day, 15 RPM).

---

## Step 3: Deploy Web App to Vercel ($0 Free Tier)
1. Go to [Vercel](https://vercel.com) and click **Add New... -> Project**.
2. Import `siddiqesq2004/jarvis`.
3. Set the **Root Directory** to `apps/web`.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER=gemini`
   - `GEMINI_API_KEY`
   - `LAPTOP_ONLINE_THRESHOLD_SECONDS=90`
5. Click **Deploy**. Vercel will build and assign you a free HTTPS domain (e.g. `https://jarvis-yourname.vercel.app`).

---

## Step 4: Install PWA on Mobile Phone
1. Open your Vercel URL in Google Chrome (Android) or Safari (iOS).
2. Tap the browser menu and select **Install app** or **Add to Home Screen**.
3. Jarvis now launches as a standalone mobile application with microphone access and full real-time voice mode.

---

## Step 5: Start Laptop Agent Locally
On your Windows laptop:
```powershell
cd E:\jarvis\services\laptop-agent
$env:JARVIS_BACKEND_URL="https://your-vercel-domain.vercel.app"
$env:JARVIS_DEVICE_ID="default-laptop-dev"
$env:JARVIS_DEVICE_TOKEN="dev-test-token-32-chars-long"

python -m src.agent
```
The agent starts immediately, sends heartbeats every 30 seconds, and uses $<20\text{ MB}$ RAM with zero large dependencies.
