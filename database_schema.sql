-- ==============================================================================
-- DATABASE SCHEMA & ROLE-BASED ACCESS CONTROL (RBAC) FOR DEV-TALK APP
-- ==============================================================================

-- 1. Setup Postgres Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define Custom Enums
DO $$ BEGIN
    CREATE TYPE workspace_role AS ENUM ('creator', 'admin', 'member', 'guest');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('online', 'offline', 'away', 'dnd');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- TABLE DEFINITIONS
-- ==============================================================================

-- USERS TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_gradient TEXT,
    profile_picture_url TEXT,
    role TEXT, -- App-level global role if any
    status user_status DEFAULT 'offline',
    timezone TEXT DEFAULT 'UTC+0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WORKSPACE MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_memberships (
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role workspace_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (workspace_id, user_id)
);

-- CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CHANNEL MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.channel_memberships (
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (channel_id, user_id)
);

-- DIRECT MESSAGE CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.direct_message_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user1_id, user2_id) -- Prevent duplicate threads
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    dm_id UUID REFERENCES public.direct_message_conversations(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_channel_or_dm CHECK (
        (channel_id IS NOT NULL AND dm_id IS NULL) OR 
        (channel_id IS NULL AND dm_id IS NOT NULL)
    )
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'mention', 'message', 'reaction', 'thread_reply', 'channel_invite', 'task_assigned', 'system'
    title TEXT NOT NULL,
    body TEXT,
    channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_message_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size TEXT,
    type TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DRAFTS TABLE
CREATE TABLE IF NOT EXISTS public.drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    context_id TEXT NOT NULL,
    context_type TEXT DEFAULT 'channel',
    content TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, context_id)
);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------
-- 1. USERS POLICIES
-------------------------------------------------------------------------
-- Everyone can read other users (Guests may be restricted in a tighter scope if needed later, but standard is public view)
CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-------------------------------------------------------------------------
-- 8. FILES POLICIES
-------------------------------------------------------------------------
CREATE POLICY "Files are viewable by everyone" ON public.files FOR SELECT USING (true);
CREATE POLICY "Users can insert their own files" ON public.files FOR INSERT WITH CHECK (auth.uid() = owner_id);

-------------------------------------------------------------------------
-- 9. DRAFTS POLICIES
-------------------------------------------------------------------------
CREATE POLICY "Users can manage their own drafts" ON public.drafts FOR ALL USING (auth.uid() = user_id);

-------------------------------------------------------------------------
-- 2. WORKSPACES POLICIES
-------------------------------------------------------------------------
-- Workspace Creators (owner_id) can edit/delete their own workspaces
CREATE POLICY "Creators can manage their workspaces" ON public.workspaces FOR ALL USING (auth.uid() = owner_id);
-- Members/Guests can view the workspace if they have a membership record
CREATE POLICY "Members can view workspaces they belong to" ON public.workspaces FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspace_memberships WHERE workspace_id = workspaces.id AND user_id = auth.uid())
);

-------------------------------------------------------------------------
-- 3. WORKSPACE MEMBERSHIPS POLICIES
-------------------------------------------------------------------------
-- Users can see all memberships (simplifies checks and avoids infinite recursion).
-- Privacy is maintained because Workspaces and Channels restrict based on these rows.
CREATE POLICY "Workspace members can see other members" ON public.workspace_memberships FOR SELECT USING (true);

-- Only Creators/Admins can add/delete/update memberships
-- (Using auth.uid() directly on the table, bypassing recursion)
CREATE POLICY "Workspace admins can manage memberships" ON public.workspace_memberships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    -- Simplest approach without recursive complex roles: Workspace owner controls it.
);
CREATE POLICY "Workspace admins can update memberships" ON public.workspace_memberships FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);
CREATE POLICY "Workspace admins can delete memberships" ON public.workspace_memberships FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR user_id = auth.uid() -- Allows users to leave the workspace
);

-------------------------------------------------------------------------
-- 4. CHANNELS POLICIES
-------------------------------------------------------------------------
-- SELECT:
-- Admins/Creators can see all channels
-- Members can see public channels + private channels they belong to
-- Guests can ONLY see channels they explicitly belong to
CREATE POLICY "Channel visibility" ON public.channels FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.workspace_memberships wm WHERE wm.workspace_id = channels.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('creator', 'admin'))
    OR 
    (EXISTS (SELECT 1 FROM public.workspace_memberships wm WHERE wm.workspace_id = channels.workspace_id AND wm.user_id = auth.uid() AND wm.role = 'member') AND is_private = false)
    OR
    EXISTS (SELECT 1 FROM public.channel_memberships WHERE channel_id = channels.id AND user_id = auth.uid())
);

-- INSERT: Only Creators/Admins/Members can create channels (Guests cannot)
CREATE POLICY "Create channels" ON public.channels FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspace_memberships WHERE workspace_id = channels.workspace_id AND user_id = auth.uid() AND role IN ('creator', 'admin', 'member'))
);

-- UPDATE/DELETE: Only channel creators or workspace admins
CREATE POLICY "Manage channels" ON public.channels FOR ALL USING (
    created_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.workspace_memberships WHERE workspace_id = channels.workspace_id AND user_id = auth.uid() AND role IN ('creator', 'admin'))
);

-------------------------------------------------------------------------
-- 5. CHANNEL MEMBERSHIPS POLICIES
-------------------------------------------------------------------------
-- SELECT: Visible to anyone who can see the channel
-- (Set to true to prevent infinite recursion, as channels already verify this table)
CREATE POLICY "Channel members viewable if channel is viewable" ON public.channel_memberships FOR SELECT USING (true);
-- INSERT: Workspace Admins can add anyone. Normal members can join public channels, or add people to channels they are already in.
CREATE POLICY "Add channel members" ON public.channel_memberships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.channels c JOIN public.workspace_memberships wm ON c.workspace_id = wm.workspace_id WHERE c.id = channel_memberships.channel_id AND wm.user_id = auth.uid() AND wm.role IN ('creator', 'admin'))
    OR
    EXISTS (SELECT 1 FROM public.channels WHERE id = channel_memberships.channel_id AND is_private = false)
    OR
    EXISTS (SELECT 1 FROM public.channel_memberships cm WHERE cm.channel_id = channel_memberships.channel_id AND cm.user_id = auth.uid())
);
-- DELETE: Users can leave channels (delete their own membership). Admins/Channel owners can remove others.
CREATE POLICY "Remove channel members" ON public.channel_memberships FOR DELETE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.channels c JOIN public.workspace_memberships wm ON c.workspace_id = wm.workspace_id WHERE c.id = channel_memberships.channel_id AND wm.user_id = auth.uid() AND wm.role IN ('creator', 'admin')) OR
    EXISTS (SELECT 1 FROM public.channels WHERE id = channel_memberships.channel_id AND created_by = auth.uid())
);

-------------------------------------------------------------------------
-- 6. DMs POLICIES
-------------------------------------------------------------------------
CREATE POLICY "Users can access their own DMs" ON public.direct_message_conversations FOR ALL USING (
    auth.uid() = user1_id OR auth.uid() = user2_id
);

-------------------------------------------------------------------------
-- 7. MESSAGES POLICIES
-------------------------------------------------------------------------
-- SELECT: Can read messages if you belong to the channel or DM
CREATE POLICY "Read permitted messages" ON public.messages FOR SELECT USING (
    (channel_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.channels c WHERE c.id = messages.channel_id))
    OR
    (dm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.direct_message_conversations dm WHERE dm.id = messages.dm_id))
);

-- INSERT: Can send messages if you belong to the channel or DM
CREATE POLICY "Send messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
        (channel_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.channel_memberships WHERE channel_id = messages.channel_id AND user_id = auth.uid()))
        OR
        (dm_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.direct_message_conversations WHERE id = messages.dm_id AND (user1_id = auth.uid() OR user2_id = auth.uid())))
    )
);

-- DELETE: Can delete own messages or if Workspace Admin
CREATE POLICY "Delete messages" ON public.messages FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.channels c JOIN public.workspace_memberships wm ON c.workspace_id = wm.workspace_id WHERE c.id = messages.channel_id AND wm.user_id = auth.uid() AND wm.role IN ('creator', 'admin'))
);

-- ==============================================================================
-- AUTHENTICATION TRIGGERS & BACKFILL
-- ==============================================================================

-- 1. Create a function to automatically sync new signups into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, username)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (Optional) Backfill any existing users from auth.users who missed the trigger
INSERT INTO public.users (id, email, display_name, username)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1) || '_' || substr(md5(random()::text), 1, 4))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
