
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Send, Plus, Smile, Bold, Italic, Strikethrough, 
  Link2, List, ListOrdered, AlignLeft, Code, Quote,
  AtSign, Video, Mic, Monitor, Terminal as TerminalIcon, X, Terminal
} from "lucide-react";
import { smartReply } from "@/ai/flows/smart-reply";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MockTerminal = ({ onClose }: { onClose: () => void }) => {
  const [history, setHistory] = useState<string[]>([
    'DevTalk Terminal v1.2.0 (Active Workspace)',
    'Connected to: node-main-01.local',
    'Type "help" for a list of commands.',
    ''
  ]);
  const [input, setInput] = useState('');
  const [textColor, setTextColor] = useState('text-green-500');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic to handle Radix UI animation delays
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        setHistory(prev => [...prev, '$']);
        setInput('');
        return;
      }

      const [cmd, ...args] = trimmedInput.toLowerCase().split(' ');
      let response = '';

      switch (cmd) {
        case 'help':
          response = 'Available commands: help, clear, status, ls, whoami, date, echo, theme, exit';
          break;
        case 'clear':
          setHistory([]);
          setInput('');
          return;
        case 'status':
          response = 'System: Online | Latency: 12ms | Storage: 4.2GB free | Active Sessions: 8';
          break;
        case 'ls':
          response = 'src/  public/  docs/  package.json  next.config.ts  README.md  .env  components/';
          break;
        case 'whoami':
          response = 'dev-user@devtalk-hq';
          break;
        case 'date':
          response = new Date().toLocaleString();
          break;
        case 'echo':
          response = args.join(' ');
          break;
        case 'theme':
          const color = args[0];
          const validColors = ['green', 'blue', 'red', 'white', 'purple', 'yellow', 'cyan'];
          if (validColors.includes(color)) {
            setTextColor(`text-${color}-500`);
            response = `Terminal theme updated to ${color}.`;
          } else {
            response = `Invalid color. Try: ${validColors.join(', ')}`;
          }
          break;
        case 'exit':
          onClose();
          return;
        default:
          response = `zsh: command not found: ${cmd}`;
      }

      const newHistory = [...history, `$ ${trimmedInput}`];
      if (response) newHistory.push(response);
      setHistory(newHistory);
      setInput('');
    }
  };

  return (
    <div 
      className="bg-[#0a0a0c] h-full flex flex-col font-code border-t border-white/10"
      onClick={() => inputRef.current?.focus()}
    >
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-6 space-y-1.5 text-sm leading-relaxed scrollbar-hide"
      >
        {history.map((line, i) => (
          <div key={i} className={cn(line.startsWith('$') ? "text-white opacity-90" : textColor)}>
            {line}
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center border-t border-white/5 px-6 py-4 bg-black/40">
        <span className={cn("font-bold shrink-0", textColor)}>$</span>
        <input 
          ref={inputRef}
          className={cn("bg-transparent border-none outline-none flex-1 font-code placeholder:opacity-20", textColor)}
          placeholder="Type command..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleCommand}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  conversationHistory,
  placeholder = "Message #general" 
}) => {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-white"
            onClick={() => setIsTerminalOpen(true)}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
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

      <Sheet open={isTerminalOpen} onOpenChange={setIsTerminalOpen}>
        <SheetContent side="bottom" className="h-[50vh] p-0 bg-[#0c0c0c] border-white/10">
          <SheetHeader className="p-4 border-b border-white/10 bg-black flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="flex items-center gap-2 text-white font-code text-sm uppercase tracking-widest">
              <TerminalIcon className="w-4 h-4 text-green-500" />
              DevTalk Terminal
            </SheetTitle>
          </SheetHeader>
          <MockTerminal onClose={() => setIsTerminalOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};
