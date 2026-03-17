"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Send, Plus, Smile, Bold, Italic, Strikethrough,
  Link2, List, ListOrdered, Code, AtSign, Video,
  Mic, Monitor, Terminal as TerminalIcon, AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from '@/database';
import { type User } from '@supabase/supabase-js';

/* ─── Mock Terminal (unchanged) ─── */
const MockTerminal = ({ onClose }: { onClose: () => void }) => {
  const [history, setHistory] = useState<string[]>([
    'DevTalk Terminal v1.2.0 (Active Workspace)',
    'Connected to: node-main-01.local',
    'Type "help" for a list of commands.',
    '',
  ]);
  const [input, setInput] = useState('');
  const [themeColor, setThemeColor] = useState('rgb(34 197 94)');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, input]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const trimmed = input.trim();
    if (!trimmed) { setHistory(p => [...p, '$ ']); setInput(''); return; }

    const parts = trimmed.split(/\s+/);
    let isSudo = parts[0].toLowerCase() === 'sudo';
    if (isSudo) parts.shift();
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    let response = '';

    const colorMap: Record<string, string> = {
      green: 'rgb(34 197 94)', blue: 'rgb(59 130 246)', red: 'rgb(239 68 68)',
      white: 'rgb(255 255 255)', purple: 'rgb(168 85 247)', yellow: 'rgb(234 179 8)', cyan: 'rgb(6 182 212)',
    };

    switch (cmd) {
      case 'help': response = 'Commands: help, clear, status, ls, whoami, date, echo, theme, npm, yarn, apt, exit'; break;
      case 'clear': setHistory([]); setInput(''); return;
      case 'status': response = 'System: Online | Latency: 12ms | Storage: 4.2GB free'; break;
      case 'ls': response = 'src/  public/  docs/  package.json  next.config.ts  README.md'; break;
      case 'whoami': response = 'dev-user@devtalk-hq'; break;
      case 'date': response = new Date().toLocaleString(); break;
      case 'echo': response = args.join(' '); break;
      case 'theme':
        if (colorMap[args[0]]) { setThemeColor(colorMap[args[0]]); response = `Theme set to ${args[0]}.`; }
        else response = `Colors: ${Object.keys(colorMap).join(', ')}`;
        break;
      case 'npm': response = args[0] === 'install' ? `added ${Math.floor(Math.random()*50)+10} packages` : 'Usage: npm install|update|start'; break;
      case 'exit': onClose(); return;
      default: response = `zsh: command not found: ${cmd}`;
    }

    const next = [...history, `$ ${trimmed}`, ...response.split('\n')];
    setHistory(next);
    setInput('');
  };

  return (
    <div className="bg-[#0a0a0c] h-full flex flex-col border-t border-white/10" onClick={() => inputRef.current?.focus()}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1 text-sm leading-relaxed">
        {history.map((line, i) => (
          <div key={i} className={line.startsWith('$') ? 'text-white/90' : ''} style={!line.startsWith('$') ? { color: themeColor } : {}}>
            {line}
          </div>
        ))}
        <div className="flex gap-2 items-center">
          <span className="font-bold shrink-0" style={{ color: themeColor }}>$</span>
          <input ref={inputRef} className="bg-transparent border-none outline-none flex-1 text-white p-0 caret-white font-mono"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleCommand}
            autoComplete="off" spellCheck={false} autoFocus />
        </div>
      </div>
    </div>
  );
};

/* ─── Message Input ─── */
interface MessageInputProps {
  channelId: string;
  user: User;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId, user, placeholder = "Message #general",
}) => {
  const [content, setContent] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { supabase } = useAuth();

  const handleSend = async () => {
    if (!content.trim() || !supabase || !user) return;
    const { error } = await supabase.from('messages').insert([{
      channel_id: channelId,
      author_id: user.id,
      content: content.trim(),
    }]);
    if (error) console.error('Error sending message:', error.message);
    else setContent('');
  };

  const applyFormatting = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = content.substring(start, end);
    setContent(content.substring(0, start) + prefix + selected + suffix + content.substring(end));
    el.focus();
  };

  const toolbarLeft = [
    { icon: Bold, action: () => applyFormatting('**', '**'), label: 'Bold' },
    { icon: Italic, action: () => applyFormatting('*', '*'), label: 'Italic' },
    { icon: Strikethrough, action: () => applyFormatting('~~', '~~'), label: 'Strikethrough' },
    null,
    { icon: Link2, action: () => {}, label: 'Link' },
    { icon: List, action: () => {}, label: 'Bullet list' },
    { icon: ListOrdered, action: () => {}, label: 'Numbered list' },
    null,
    { icon: AlignLeft, action: () => {}, label: 'Block quote' },
    { icon: Code, action: () => applyFormatting('`', '`'), label: 'Inline code' },
    { icon: Monitor, action: () => applyFormatting('```\n', '\n```'), label: 'Code block' },
    { icon: TerminalIcon, action: () => setIsTerminalOpen(true), label: 'Terminal' },
  ];

  return (
    <div className="px-5 pb-5 pt-2 bg-[#1a1d21]">
      <div className="rounded-lg border border-white/[0.12] bg-[#222529] overflow-hidden focus-within:border-white/20 transition-colors">

        {/* Formatting toolbar */}
        <div className="flex items-center gap-0 px-2 pt-1.5 pb-1 border-b border-white/[0.07]">
          {toolbarLeft.map((item, i) =>
            item === null ? (
              <div key={i} className="w-px h-4 bg-white/10 mx-1" />
            ) : (
              <button
                key={item.label}
                title={item.label}
                onClick={item.action}
                className="h-7 w-7 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors"
              >
                <item.icon className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Textarea */}
        <div className="px-3 py-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none focus:ring-0 resize-none text-[14px] text-[#d1d2d3] placeholder:text-[#5c5f63] scrollbar-hide min-h-[44px] leading-[1.55]"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-0">
            <button title="Attach" className="h-8 w-8 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button title="Emoji" className="h-8 w-8 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors">
              <Smile className="w-4 h-4" />
            </button>
            <button title="Mention" className="h-8 w-8 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors">
              <AtSign className="w-4 h-4" />
            </button>
            <button title="Video" className="h-8 w-8 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors">
              <Video className="w-4 h-4" />
            </button>
            <button title="Audio" className="h-8 w-8 flex items-center justify-center rounded text-[#b9babd] hover:text-white hover:bg-white/10 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Send button — Slack-style split button */}
          <div className="flex items-center">
            <button
              onClick={handleSend}
              disabled={!content.trim()}
              className={cn(
                "flex items-center gap-1.5 h-8 px-3 rounded-l-lg text-[13px] font-semibold transition-all",
                content.trim()
                  ? "bg-[#007a5a] hover:bg-[#148567] text-white"
                  : "bg-white/[0.06] text-[#5c5f63] cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
            <button
              disabled={!content.trim()}
              className={cn(
                "flex items-center justify-center h-8 w-7 rounded-r-lg border-l transition-all",
                content.trim()
                  ? "bg-[#007a5a] hover:bg-[#148567] text-white border-[#005e44]"
                  : "bg-white/[0.06] text-[#5c5f63] border-white/10 cursor-not-allowed"
              )}
            >
              <svg className="w-3 h-3" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6H0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal sheet */}
      <Sheet open={isTerminalOpen} onOpenChange={setIsTerminalOpen}>
        <SheetContent side="bottom" className="h-[50vh] p-0 bg-[#0c0c0c] border-white/10">
          <SheetHeader className="p-4 border-b border-white/10 bg-black flex flex-row items-center space-y-0">
            <SheetTitle className="flex items-center gap-2 text-white font-mono text-sm uppercase tracking-widest">
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