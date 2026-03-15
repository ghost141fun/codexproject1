
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Send, Plus, Smile, Bold, Italic, Strikethrough, 
  Link2, List, ListOrdered, AlignLeft, Code, Quote,
  AtSign, Video, Mic, Monitor, Terminal as TerminalIcon, X, Terminal
} from "lucide-react";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from '@/database';
import { type User } from '@supabase/supabase-js';


const MockTerminal = ({ onClose }: { onClose: () => void }) => {
  const [history, setHistory] = useState<string[]>([
    'DevTalk Terminal v1.2.0 (Active Workspace)',
    'Connected to: node-main-01.local',
    'Type "help" for a list of commands.',
    ''
  ]);
  const [input, setInput] = useState('');
  const [themeColor, setThemeColor] = useState('rgb(34 197 94)'); // green-500
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [history, input]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        setHistory(prev => [...prev, '$ ']);
        setInput('');
        return;
      }

      const rawParts = trimmedInput.split(/\s+/);
      let parts = [...rawParts];
      let isSudo = false;
      
      if (parts[0].toLowerCase() === 'sudo') {
        isSudo = true;
        parts.shift();
      }

      const cmd = parts[0]?.toLowerCase();
      const args = parts.slice(1);
      let response: string = '';

      if (!cmd) {
         if (isSudo) response = 'usage: sudo [-v] [-h] [-l] [-L] [-p prompt] [-u user] command';
      } else {
        switch (cmd) {
          case 'help':
            response = [
              'System Commands:',
              '  help, clear, status, ls, whoami, date, echo, theme, exit, sudo',
              'Package Managers:',
              '  npm [install|update|start]',
              '  yarn [add|upgrade]',
              '  apt [update|upgrade|install]',
              'Maintenance:',
              '  install <package>',
              '  update',
              '  upgrade'
            ].join('\n');
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
            const colorMap: Record<string, string> = {
              green: 'rgb(34 197 94)',
              blue: 'rgb(59 130 246)',
              red: 'rgb(239 68 68)',
              white: 'rgb(255 255 255)',
              purple: 'rgb(168 85 247)',
              yellow: 'rgb(234 179 8)',
              cyan: 'rgb(6 182 212)'
            };
            if (color && colorMap[color]) {
              setThemeColor(colorMap[color]);
              response = `Terminal theme updated to ${color}.`;
            } else {
              response = `Invalid color. Try: ${Object.keys(colorMap).join(', ')}`;
            }
            break;
          case 'npm':
            const npmSub = args[0]?.toLowerCase();
            if (npmSub === 'install' || npmSub === 'i') {
              response = `added ${Math.floor(Math.random() * 50) + 10} packages in 4s`;
            } else if (npmSub === 'update') {
              response = 'up to date, audited 452 packages in 854ms';
            } else if (npmSub === 'start') {
              response = 'Starting dev server on port 3000...';
            } else {
              response = 'Usage: npm <command> (install, update, start)';
            }
            break;
          case 'yarn':
            const yarnSub = args[0]?.toLowerCase();
            if (yarnSub === 'add') {
              response = 'success Saved 1 new dependency.';
            } else if (yarnSub === 'upgrade') {
              response = 'success All dependencies up to date.';
            } else {
              response = 'Usage: yarn <command> (add, upgrade)';
            }
            break;
          case 'apt':
            const aptSub = args[0]?.toLowerCase();
            if (aptSub === 'update') {
              response = 'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nReading package lists... Done';
            } else if (aptSub === 'upgrade') {
              response = '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.';
            } else if (aptSub === 'install') {
              response = `Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\n${args[1] || 'package'} is already the newest version.`;
            } else {
              response = 'Usage: apt <command> (update, upgrade, install)';
            }
            break;
          case 'install':
            response = `Searching for ${args[0] || 'packages'}... found 1 match. Installing... Done.`;
            break;
          case 'update':
            response = 'Checking for system updates... system is up to date.';
            break;
          case 'upgrade':
            response = 'Processing upgrades... nothing to upgrade.';
            break;
          case 'exit':
            onClose();
            return;
          default:
            response = `zsh: command not found: ${cmd}`;
        }
      }

      const newHistory = [...history, `$ ${trimmedInput}`];
      if (response) {
        const responseLines = response.split('\n');
        newHistory.push(...responseLines);
      }
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
          <div 
            key={i} 
            className={cn(line.startsWith('$') ? "text-white opacity-90" : "")}
            style={!line.startsWith('$') ? { color: themeColor } : {}}
          >
            {line}
          </div>
        ))}
        
        <div className="flex gap-2 items-center">
          <span className="font-bold shrink-0" style={{ color: themeColor }}>$</span>
          <input 
            ref={inputRef}
            className="bg-transparent border-none outline-none flex-1 font-code text-white p-0 caret-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};

interface MessageInputProps {
  channelId: string;
  user: User;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  channelId,
  user,
  placeholder = "Message #general" 
}) => {
  const [content, setContent] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { supabase } = useAuth();

  const handleSend = async () => {
    if (content.trim() && supabase && user) {
      const newMessage = {
        channel_id: channelId,
        user_id: user.id,
        content: content.trim(),
      };

      const { error } = await supabase.from('messages').insert([newMessage]);

      if (error) {
        console.error('Error sending message:', error.message);
      } else {
        setContent('');
      }
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
      <div className="bg-[#1a1d21] border border-white/10 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-shadow">
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
