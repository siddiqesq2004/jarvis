# Jarvis — Cloud-First Personal AI Companion

[![Jarvis CI](https://github.com/siddiqesq2004/jarvis/actions/workflows/ci.yml/badge.svg)](https://github.com/siddiqesq2004/jarvis/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero-Cost](https://img.shields.io/badge/Cost-$0%20Free%20Tier-success)](docs/DEPLOYMENT.md)

A personal, cloud-first AI companion that develops gradual familiarity with its user, speaks naturally via client-side Web Speech APIs, is installable as a mobile PWA, and controls approved laptop functions through a secure, lightweight Windows bridge with real-time **laptop availability detection (Online, Sleeping, Offline, Reconnected)**.

---

## Key Features

1. **Zero-Cost-First Architecture**: 100% free hosting and compute (Vercel Hobby, Supabase Free Tier, Google Gemini 1.5/2.0 Flash Free Tier via Google AI Studio).
2. **Minimal Local Storage & RAM Footprint**:
   - Zero local LLMs or large model weights on the laptop.
   - Entire laptop agent code is **$< 100\text{ KB}$** on disk and consumes **$< 20\text{ MB}$ RAM**.
   - Cloud chat remains 100% functional even if the laptop agent is never installed or is offline.
3. **Laptop Availability Detection**:
   - **Laptop Online**: Live green heartbeat indicator (<90s), verified system telemetry, approved command execution.
   - **Laptop Unavailable**: Amber indicator when sleeping, shut down, or disconnected. Cloud conversations continue without interruption. Commands are held safely in a queue.
   - **Laptop Reconnected**: Restores online state and revalidates queued tasks.
   - **Laptop Agent Error**: Safe diagnostic alerts.
4. **Gradual Familiarity & Long-Term Memory**: Automatically extracts durable preferences and ongoing projects into PostgreSQL with user inspection and deletion controls.
5. **Real-time Voice Mode**: Browser-native Speech Recognition (STT) and Speech Synthesis (TTS) with interruption support and audio wave visualizer.
6. **Mobile PWA**: Installable on Android and iOS home screens with standalone viewport and push-to-talk.
7. **Strict Security Sandbox**: No arbitrary shell or PowerShell access, path traversal prevention, explicit user confirmation for sensitive commands, and mutual token authentication.

---

## Local Laptop Disk & Resource Audit

| Component | Target Location | Measured Storage Footprint | Memory (RAM) Usage |
| :--- | :--- | :--- | :--- |
| **Python Laptop Agent** | `E:\jarvis\services\laptop-agent` | **~75 KB** | **$\le 15\text{ MB}$** |
| **Rotating Diagnostic Logs** | `services/laptop-agent/logs` | Capped at **4 MB** (auto-rotating) | N/A |
| **Local LLM Models** | *None (Cloud-only)* | **0 MB** | **0 MB** |
| **Local Databases** | *None (Supabase Cloud)* | **0 MB** | **0 MB** |

---

## Quickstart: Local Verification

### 1. Run Python Laptop Agent Tests
```powershell
cd E:\jarvis\services\laptop-agent
python -m unittest discover tests
```
*Verifies heartbeat generation, 90s timeout logic, path traversal rejection, allowlisting, and duplicate command prevention.*

### 2. Run Web Availability Tests
```powershell
cd E:\jarvis\apps\web
node --test tests/availability.test.mjs
```
*Verifies laptop online/unavailable state evaluation, cloud chat independence, and command queue safety.*

### 3. Run Web App Locally
```powershell
cd E:\jarvis\apps\web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome or Microsoft Edge.

---

## Documentation Links

- [Architecture & Availability Protocol](docs/ARCHITECTURE.md)
- [Security Sandbox & Allowlist](docs/SECURITY.md)
- [Zero-Cost Free Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

## License

MIT License. Built for personal, privacy-first, zero-cost everyday assistance.
