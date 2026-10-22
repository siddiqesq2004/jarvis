-- Optional Seed Data for testing Jarvis Companion
-- In production, user profiles are created upon Supabase Auth signup.

-- Sample prompt template notes
COMMENT ON TABLE public.memories IS 'Stores long-term user preferences and facts to personalize conversation context.';
COMMENT ON TABLE public.devices IS 'Tracks registered laptops and evaluates availability via server-side heartbeat timestamps.';
COMMENT ON TABLE public.device_commands IS 'Queues user-approved allowlisted actions for outbound execution by the laptop agent.';
