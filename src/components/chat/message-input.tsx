"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from "lucide-react";
import { useAuth } from '@/database';
import { RichTextEditor, type Person, type SentMessage } from '@/components/chat/rich-text-editor';

interface MessageInputProps {
  channelId: string;
  user: any;
  workspaceId?: string;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId, user, workspaceId, placeholder = "Message channel",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [members, setMembers] = useState<Person[]>([]);
  const { supabase } = useAuth();

  // ── Fetch Workspace Members for Mentions ──
  useEffect(() => {
    const fetchMembers = async () => {
      if (!supabase) return;

      let memberIds: string[] = [];

      if (workspaceId) {
        // 1. Get member IDs for the current workspace
        const { data: memberRecords } = await supabase
          .from('workspace_memberships')
          .select('user_id')
          .eq('workspace_id', workspaceId);
        
        memberIds = (memberRecords ?? []).map(m => m.user_id);
      }

      // 2. Fallback: If no workspace members (or only self), or no workspaceId, load ALL users 
      // This is helpful in early development/testing contexts
      if (memberIds.length <= 1) {
        const { data: allUsers } = await supabase
          .from('users')
          .select('id');
        memberIds = (allUsers ?? []).map(u => u.id);
      }

      // 3. Fetch the actual profiles for these IDs
      if (memberIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('id, display_name, username, avatar_gradient, role, status')
        .in('id', memberIds);

      if (profileError) {
        console.error('Error fetching profiles for mentions:', profileError);
        return;
      }

      const people: Person[] = (profiles || []).map((u: any) => {
        return {
          id: u.id,
          name: u.display_name || u.username || 'User',
          avatar: (u.display_name || u.username || 'U')[0].toUpperCase(),
          color: u.avatar_gradient || '#7c3aed',
          status: (u.status || 'offline') as any,
          role: u.role || ''
        };
      });

      setMembers(people);
    };

    fetchMembers();
  }, [supabase, workspaceId]);

  /* ── Upload a single file/blob to Supabase Storage ── */
  const uploadAttachment = async (blobUrl: string, name: string, type: string): Promise<string | null> => {
    if (!supabase || !user) return null;

    try {
      const res = await fetch(blobUrl);
      const blob = await res.blob();
      const path = `${user.id}/${Date.now()}_${name.replace(/\s+/g, '_')}`;
      
      const { error: storageError } = await supabase.storage.from('Files').upload(path, blob, { 
        upsert: false,
        contentType: type 
      });
      
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('Files').getPublicUrl(path);

      // Register file in the files table so it shows in the workspace Files tab
      await supabase.from('files').insert({
        name: name,
        url: publicUrl,
        size: blob.size.toString(),
        type: type,
        owner_id: user.id,
        channel_id: channelId,
      });

      return publicUrl;
    } catch (err) {
      console.error('Attachment upload error:', err);
      return null;
    }
  };

  /* ── Unified Send Logic for RichTextEditor ── */
  const handleSend = async (msg: SentMessage) => {
    if (!supabase || !user) return;

    let finalContent = msg.formattedText;
    let attachmentUrl = msg.attachmentUrl;

    // Handle local blobs (voice, video, or pasted files)
    if (attachmentUrl?.startsWith('blob:')) {
      setIsUploading(true);
      const uploadedUrl = await uploadAttachment(
        attachmentUrl, 
        msg.attachmentName || `attachment_${Date.now()}`, 
        msg.attachmentType === 'audio' ? 'audio/webm' : msg.attachmentType === 'video' ? 'video/webm' : 'application/octet-stream'
      );
      
      if (uploadedUrl) {
        attachmentUrl = uploadedUrl;
        // Construct markdown link for the channel message list to render
        const label = msg.attachmentName || msg.attachmentType || 'Attachment';
        const prefix = msg.attachmentType === 'audio' ? '🎵' : msg.attachmentType === 'video' ? '🎬' : '📎';
        finalContent += `\n${prefix} [${label}](${uploadedUrl})`;
      }
      setIsUploading(false);
    }

    const { error } = await supabase.from('messages').insert([{
      channel_id: channelId,
      author_id: user.id,
      content: finalContent.trim(),
    }]);

    if (error) {
      console.error('Error sending message:', error.message);
    }
  };

  return (
    <div className="relative px-4 pb-4 bg-[#1a1d21]">
      {isUploading && (
        <div className="absolute inset-x-4 -top-8 z-10 flex items-center gap-2 bg-[#222529] px-3 py-1.5 rounded-lg border border-white/10 shadow-xl">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a855f7]" />
          <span className="text-[#e8eaf0] text-[11px] font-semibold">Uploading media...</span>
        </div>
      )}
      <RichTextEditor
        placeholder={placeholder}
        people={members}
        draftId={channelId}
        draftType="channel"
        onSend={handleSend}
      />
    </div>
  );
};