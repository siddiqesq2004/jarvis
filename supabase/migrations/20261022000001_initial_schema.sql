-- ========================================================
-- JARVIS PERSONAL AI COMPANION — DATABASE SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    companion_name TEXT DEFAULT 'Jarvis',
    personality_style TEXT DEFAULT 'warm_adaptive', -- 'warm_adaptive', 'concise_professional', 'casual_friendly'
    preferred_language TEXT DEFAULT 'en',
    familiarity_stage INT DEFAULT 1, -- 1: Introductions, 2: Preferences, 3: Goals, 4: Personalized, 5: Proactive
    voice_speed REAL DEFAULT 1.0,
    voice_pitch REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'New Conversation',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    provider TEXT, -- 'gemini', 'groq', 'mock'
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEMORIES TABLE (Long-term Personalization)
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('preference', 'project', 'goal', 'workflow', 'fact', 'routine')),
    content TEXT NOT NULL,
    confidence REAL DEFAULT 0.8 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    provenance TEXT, -- e.g. "conversation_msg_id_or_user_explicit"
    is_approved BOOLEAN DEFAULT TRUE,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEVICES TABLE (Laptop Availability & Heartbeat Detection)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_token_hash TEXT NOT NULL,
    agent_version TEXT DEFAULT '1.0.0',
    -- connection_status derived or stored from heartbeat
    connection_status TEXT DEFAULT 'unavailable' CHECK (connection_status IN ('online', 'unavailable', 'error', 'reconnecting')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'error')),
    last_heartbeat_at TIMESTAMPTZ, -- Primary evidence of connectivity (server receipt timestamp)
    last_connected_at TIMESTAMPTZ,
    last_error_code TEXT,
    os_info JSONB DEFAULT '{}'::jsonb,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEVICE COMMANDS TABLE (Command Queue & Allowlist Execution)
CREATE TABLE IF NOT EXISTS public.device_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    command_type TEXT NOT NULL, -- 'system_info', 'launch_app', 'open_url', 'list_files', 'read_file', 'create_file', 'copy_clipboard', 'screenshot'
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (
        status IN ('pending_approval', 'waiting_reconnect', 'dispatched', 'executing', 'completed', 'failed', 'rejected', 'expired')
    ),
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    result JSONB DEFAULT NULL,
    error_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    dispatched_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AUDIT EVENTS TABLE (Immutable Security Log)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEEDBACK TABLE (Controlled User-Driven Improvement)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    rating INT CHECK (rating IN (-1, 1)), -- -1 = Thumbs Down, 1 = Thumbs Up
    feedback_text TEXT,
    suggested_improvement TEXT,
    applied_to_memory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memories_user ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_heartbeat ON public.devices(last_heartbeat_at);
CREATE INDEX IF NOT EXISTS idx_device_commands_device ON public.device_commands(device_id, status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Conversations: Users can manage own conversations
CREATE POLICY "Users can manage own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = user_id);

-- Messages: Users can manage own messages
CREATE POLICY "Users can manage own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

-- Memories: Users can manage own memories
CREATE POLICY "Users can manage own memories" ON public.memories
    FOR ALL USING (auth.uid() = user_id);

-- Devices: Users can manage own registered devices
CREATE POLICY "Users can manage own devices" ON public.devices
    FOR ALL USING (auth.uid() = user_id);

-- Commands: Users can manage own commands
CREATE POLICY "Users can manage own commands" ON public.device_commands
    FOR ALL USING (auth.uid() = user_id);

-- Audit Events: Users can view own audit events
CREATE POLICY "Users can view own audit events" ON public.audit_events
    FOR SELECT USING (auth.uid() = user_id);

-- Feedback: Users can manage own feedback
CREATE POLICY "Users can manage own feedback" ON public.feedback
    FOR ALL USING (auth.uid() = user_id);
