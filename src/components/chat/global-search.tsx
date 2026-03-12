"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Hash, Clock, ImageIcon, FileText, Code, User } from "lucide-react";
import { Message, FileAsset } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Record<string, Message[]>;
  files: FileAsset[];
  onSelectResult: (id: string, type: 'channel' | 'dm') => void;
}

export function GlobalSearch({ open, onOpenChange, messages, files, onSelectResult }: GlobalSearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return { messages: [], files: [] };

    const q = query.toLowerCase();

    // Search Files
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(q));

    // Search Messages
    const allMessages: (Message & { containerId: string })[] = [];
    Object.entries(messages).forEach(([containerId, msgs]) => {
      msgs.forEach(m => {
        if (m.content.toLowerCase().includes(q)) {
          allMessages.push({ ...m, containerId });
        }
      });
    });

    return {
      messages: allMessages.slice(0, 20),
      files: filteredFiles.slice(0, 20)
    };
  }, [query, messages, files]);

  const handleSelect = (id: string, type: 'channel' | 'dm') => {
    onSelectResult(id, type);
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 bg-[#1a1d21] border-white/10 text-white overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Workspace</DialogTitle>
          <DialogDescription>
            Find messages, files, and members across all your channels and direct messages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center px-4 h-14 border-b border-white/5 bg-white/5">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            autoFocus
            placeholder="Search messages, files, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/50 h-full p-0"
          />
          <div className="flex items-center gap-1.5 ml-4">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>
          </div>
        </div>

        <ScrollArea className="max-h-[500px]">
          {query.trim() === '' ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold">Search everything</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Find messages, code snippets, documents, and images across all your channels and direct messages.
              </p>
            </div>
          ) : (results.messages.length === 0 && results.files.length === 0) ? (
            <div className="p-12 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-4 space-y-8">
              {results.messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Messages</h4>
                  <div className="grid gap-1">
                    {results.messages.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelect(m.containerId, m.containerId.startsWith('dm') ? 'dm' : 'channel')}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 text-left transition-colors group w-full"
                      >
                        <Avatar className="w-8 h-8 rounded shrink-0">
                          <AvatarImage src={m.senderAvatar} />
                          <AvatarFallback className="rounded">{m.senderName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-sm truncate">{m.senderName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {m.containerId}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 line-clamp-2">
                            {m.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(m.timestamp), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.files.length > 0 && (
                <div className="space-y-3">
                  <h4 className="px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Files</h4>
                  <div className="grid gap-1">
                    {results.files.map((f) => (
                      <button
                        key={f.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 text-left transition-colors group w-full"
                      >
                        <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                          {f.type === 'image' ? <ImageIcon className="w-5 h-5 text-blue-400" /> : f.type === 'code' ? <Code className="w-5 h-5 text-green-400" /> : <FileText className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{f.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{f.size}</span>
                            <span className="capitalize">{f.type}</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {f.ownerName}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(f.uploadedAt), 'MMM d')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="h-10 px-4 border-t border-white/5 bg-black/20 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><kbd className="px-1 rounded border border-white/10 bg-white/5 font-mono">ENTER</kbd> to open result</span>
          </div>
          <div className="flex items-center gap-4">
             <span>Found {results.messages.length + results.files.length} results</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}