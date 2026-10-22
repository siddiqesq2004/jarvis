# Jarvis Troubleshooting Guide

### 1. Laptop shows "Laptop Unavailable"
- **Reason**: The backend has not received an authenticated heartbeat within the last 90 seconds. The laptop may be sleeping, shut down, disconnected from Wi-Fi, or the agent process terminated.
- **Resolution**:
  1. Check if your laptop is awake and connected to the internet.
  2. Open PowerShell in `E:\jarvis\services\laptop-agent` and check if `python -m src.agent` is running.
  3. Look at `services/laptop-agent/logs/agent.log` for any network errors or authentication failures.
  4. Note: You can continue chatting with Jarvis on your phone or browser freely while the laptop is offline.

### 2. Voice Recognition does not start
- **Reason**: The browser requires explicit microphone permissions over a secure HTTPS context.
- **Resolution**:
  1. Ensure the site is served over `https://` (or `http://localhost:3000` during local development).
  2. In your browser settings, ensure microphone permission is set to "Allow".
  3. Web Speech API is supported natively in Google Chrome, Microsoft Edge, and modern Android browsers.

### 3. AI provider returns 429 Rate Limit
- **Reason**: The free-tier quota of Google Gemini Flash (15 RPM) was momentarily exceeded.
- **Resolution**:
  1. Jarvis automatically retries and falls back to Groq Cloud free tier or the offline mock provider without crashing.
  2. You can switch providers in `Settings` or configure `GROQ_API_KEY` as a secondary free provider.
