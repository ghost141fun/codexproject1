'use client';

import React from 'react';
import { X, Hash, MessageSquare } from 'lucide-react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ThreadPanelProps {
  parentMessage: any;
  user: any;
  onClose: () => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({ parentMessage, user, onClose }) => {
  if (!parentMessage) return null;

  return (
    <div className="w-[400px] flex flex-col bg-[#1a1d21] border-l border-white/[0.07] h-full shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-[49px] flex items-center justify-between px-4 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#b9babd]" />
          <h2 className="font-bold text-[15px] text-white">Thread</h2>
          <span className="text-[12px] text-[#b9babd] font-normal truncate max-w-[120px]">
             in #{parentMessage.channel_name || 'channel'}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-white/10 text-[#b9babd] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Parent Message Section */}
        <div className="p-4 border-b border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-start gap-3">
            <Avatar className="w-9 h-9 rounded-lg shrink-0">
              <AvatarImage src={parentMessage.author_avatar} />
              <AvatarFallback className="rounded-lg bg-[#4a154b] text-white">
                {(parentMessage.author_name || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[15px] text-white">
                  {parentMessage.author_name}
                </span>
                <span className="text-[11px] text-[#b9babd]">
                  {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-[15px] text-[#d1d2d3] leading-relaxed break-words">
                {parentMessage.content}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[11px] font-bold text-[#b9babd] uppercase tracking-wider">Replies</span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>
        </div>

        {/* Replies List */}
        <div className="flex-1 min-h-0 bg-[#1a1d21]">
          <MessageList 
            channelId={parentMessage.channel_id} 
            parentId={parentMessage.id}
          />
        </div>
      </div>

      {/* Thread Input */}
      <div className="p-4 bg-[#1a1d21] border-t border-white/[0.07]">
        <MessageInput 
          channelId={parentMessage.channel_id}
          parentId={parentMessage.id}
          user={user}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
};
