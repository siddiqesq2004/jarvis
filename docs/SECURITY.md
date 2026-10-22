# Jarvis Security Specification

## 1. Zero-Trust Laptop Bridge Design

The laptop agent is an isolated execution bridge with strict security boundaries:

1. **Zero Inbound Ports**: The agent does not bind to any network socket. It connects strictly outbound to the HTTPS backend via polling/WSS.
2. **No Arbitrary Shell Execution**: The agent never invokes `shell=True` or passes user text into PowerShell / Command Prompt interpreters.
3. **Strict Command Allowlist**: Only explicitly mapped handlers are recognized:
   - `system_info` (Read-only OS & RAM diagnostics via standard library)
   - `launch_app` (Permitted application executables only)
   - `open_url` (Strict http/https URLs via system default browser)
   - `list_files` (Confined to user-approved workspace directory)
   - `read_file` (Confined to workspace directory, max 100 KB limit)
   - `create_file` (Confined to workspace directory)
   - `copy_clipboard` (Native clip execution)
   - `screenshot` (Requires explicit user confirmation flag)
4. **Path Traversal Prevention**: Any file path containing `..`, absolute drives escaping workspace, or symlinks is rejected immediately with an alert log.
5. **Replay & Duplicate Protection**: Command IDs are tracked and deduplicated. Replay attacks are ignored.
6. **Command Expiry**: Commands have a strict 10-minute time-to-live (`expires_at`). Expired commands cannot be executed after reconnecting.

## 2. Data Protection & Row Level Security (RLS)

- Every record in Supabase PostgreSQL (`profiles`, `conversations`, `messages`, `memories`, `devices`, `device_commands`) has an active Row Level Security policy scoped to `auth.uid() = user_id`.
- Users cannot view, modify, or delete another user's device commands or memories.
- Server-side keys (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) remain strictly on Vercel serverless environment variables and are never bundled into client JavaScript.
