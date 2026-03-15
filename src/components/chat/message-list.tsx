
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Message } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { RichTextRenderer } from "./rich-text-renderer";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/database';
import { type User } from '@supabase/supabase-js';


interface MessageListProps {
  channelId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { supabase } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:channel_id=eq.${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, channelId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!supabase || messages.length === 0) return;

      const userIds = [...new Set(messages.map((m) => m.user_id))];
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        const usersById = (data || []).reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
        setUsers(usersById);
      }
    };

    fetchUsers();
  }, [supabase, messages]);


  const formatMessageTime = (timestamp: string) => {
    if (!mounted) return "";
    try {
      return format(new Date(timestamp), 'hh:mm a');
    } catch (e) {
      return "";
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
    >
      {/* Welcome Header */}
      <div className="space-y-4 mb-12">
        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
          <Hash className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black">Welcome to #general!</h1>
        <p className="text-muted-foreground">
          This is the start of the <span className="font-bold text-white">#general</span> channel.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
          <span className="bg-[#1a1d21] px-4 text-muted-foreground/60">Today</span>
        </div>
      </div>

      <div className="space-y-1">
        {messages.map((message, index) => {
          const user = users[message.user_id];
          const isSameUserAsLast = index > 0 && messages[index - 1].user_id === message.user_id;
          const showFullMessage = !isSameUserAsLast;

          return (
            <div 
              key={message.id} 
              className={cn(
                "flex gap-4 group hover:bg-white/[0.03] -mx-6 px-6 py-1.5 transition-colors",
                showFullMessage ? "mt-4" : "mt-0"
              )}
            >
              <div className="w-10 shrink-0">
                {showFullMessage ? (
                  <Avatar className="w-10 h-10 rounded cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="rounded">{user?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-full flex justify-center opacity-0 group-hover:opacity-100">
                     <span className="text-[10px] text-muted-foreground/60 mt-1">
                       {formatMessageTime(message.created_at).split(' ')[0]}
                     </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col min-w-0">
                {showFullMessage && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm hover:underline cursor-pointer">{user?.full_name}</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                )}
                <RichTextRenderer content={message.content} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
