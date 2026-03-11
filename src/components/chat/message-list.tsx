
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Message } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { RichTextRenderer } from "./rich-text-renderer";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  activeName?: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, activeName = "general" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        <h1 className="text-3xl font-black">Welcome to #{activeName}!</h1>
        <p className="text-muted-foreground">
          This is the start of the <span className="font-bold text-white">#{activeName}</span> channel.
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
          const isSameUserAsLast = index > 0 && messages[index - 1].senderId === message.senderId;
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
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback className="rounded">{message.senderName[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-full flex justify-center opacity-0 group-hover:opacity-100">
                     <span className="text-[10px] text-muted-foreground/60 mt-1">
                       {formatMessageTime(message.timestamp).split(' ')[0]}
                     </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col min-w-0">
                {showFullMessage && (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm hover:underline cursor-pointer">{message.senderName}</span>
                    <span className="text-[11px] text-muted-foreground/60">
                      {formatMessageTime(message.timestamp)}
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
