-- Create conversation_sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gardener_id UUID NOT NULL REFERENCES gardeners(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_gardener_id
    ON conversation_sessions(gardener_id);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_last_message_at
    ON conversation_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id
    ON conversation_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at
    ON conversation_messages(created_at);

-- Enable Row Level Security
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_sessions
CREATE POLICY "Users can view their own conversation sessions"
    ON conversation_sessions FOR SELECT
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own conversation sessions"
    ON conversation_sessions FOR INSERT
    WITH CHECK (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own conversation sessions"
    ON conversation_sessions FOR UPDATE
    USING (gardener_id IN (
        SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
    ));

-- Create policies for conversation_messages
CREATE POLICY "Users can view messages in their sessions"
    ON conversation_messages FOR SELECT
    USING (session_id IN (
        SELECT id FROM conversation_sessions
        WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can create messages in their sessions"
    ON conversation_messages FOR INSERT
    WITH CHECK (session_id IN (
        SELECT id FROM conversation_sessions
        WHERE gardener_id IN (
            SELECT id FROM gardeners WHERE auth_user_id = auth.uid()
        )
    ));
