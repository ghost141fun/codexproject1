"use client";

import React from 'react';
import { Home, MessageSquare, Bell, FileText, Radio, Plus, LogOut } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth } from '@/database';
import { useRouter } from 'next/navigation';

interface SideRailProps {
  activeView: 'home' | 'dms' | 'activity' | 'files' | 'huddles';
  onViewChange: (view: 'home' | 'dms' | 'activity' | 'files' | 'huddles') => void;
}

export const SideRail: React.FC<SideRailProps> = ({ activeView, onViewChange }) => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'dms', icon: MessageSquare, label: 'DMs' },
    { id: 'activity', icon: Bell, label: 'Activity' },
    { id: 'files', icon: FileText, label: 'Files' },
    { id: 'huddles', icon: Radio, label: 'Huddles' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = user?.user_metadata?.display_name || user?.email || 'U';

  return (
    <div className="w-[70px] bg-[#121016] flex flex-col items-center py-4 gap-6 shrink-0 border-r border-white/5">
      <div
        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-white mb-2 shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform"
        onClick={() => onViewChange('home')}
      >
        DT
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 group transition-colors relative",
              activeView === item.id ? "text-white" : "text-muted-foreground hover:text-white"
            )}
          >
            {activeView === item.id && (
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            )}
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              activeView === item.id ? "bg-white/10" : "group-hover:bg-white/5"
            )}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4">
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-white/5 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-6 h-6" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
          <Plus className="w-6 h-6" />
        </button>
        <Avatar className="w-9 h-9 rounded-lg cursor-pointer border border-white/10 ring-primary/20 hover:ring-2 transition-all">
          <AvatarImage src={`https://picsum.photos/seed/${user?.id || 'user'}/100/100`} />
          <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
            {displayName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};