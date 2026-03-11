"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Send, Plus, Smile, Bold, Italic, Strikethrough, 
  Link2, List, ListOrdered, AlignLeft, Code, Quote,
  AtSign, Video, Mic, Monitor
} from "lucide-react";
import { smartReply } from "@/ai/flows/smart-reply";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  conversationHistory: Message[];
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  conversationHistory,
  placeholder = "Message #general" 
}) => {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content.length > 5) {
        try {
          const history = conversationHistory.slice(-5).map(m => ({
            sender: m.senderName,
            content: m.content
          }));
          const result = await smartReply({ conversationHistory: history, currentUserInput: content });
          setSuggestions(result.suggestions);
        } catch (e) {
          console.error("Smart reply error", e);
        }
      } else {
        setSuggestions([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, conversationHistory]);

  const handleSend = () => {
    if (content.trim()) {
      onSendMessage(content);
      setContent('');
      setSuggestions([]);
    }
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    const start = textareaRef.current?.selectionStart || 0;
    const end = textareaRef.current?.selectionEnd || 0;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 bg-background space-y-3">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onSendMessage(s);
                setSuggestions([]);
                setContent('');
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="bg-[#1a1d21] border border-white/10 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-shadow">
        {/* Formatting Bar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => applyFormatting('**', '**')}>
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => applyFormatting('*', '*')}>
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => applyFormatting('~~', '~~')}>
            <Strikethrough className="w-3.5 h-3.5" />
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
            <Link2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
            <AlignLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => applyFormatting('`', '`')}>
            <Code className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={() => applyFormatting('```\n', '\n```')}>
            <Monitor className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent border-none focus:ring-0 resize-none py-1 text-sm text-foreground placeholder:text-muted-foreground/50 scrollbar-hide min-h-[40px]"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#1a1d21]">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
              <Plus className="w-4 h-4" />
            </Button>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
              <AtSign className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleSend} 
            disabled={!content.trim()} 
            className={cn(
              "h-8 px-3 rounded text-[11px] font-bold transition-all",
              content.trim() ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white/5 text-muted-foreground"
            )}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};