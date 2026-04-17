"use client";

import React from 'react';
import { Home, MessageSquare, Bell, FileText, Headphones, Plus, LogOut, Blocks, Edit3 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useAuth } from '@/database';
import { useRouter } from 'next/navigation';

interface SideRailProps {
  activeView: 'home' | 'dms' | 'activity' | 'files' | 'huddles' | 'integrations' | 'profile' | 'drafts';
  onViewChange: (view: 'home' | 'dms' | 'activity' | 'files' | 'huddles' | 'integrations' | 'profile' | 'drafts') => void;
  onOpenAddMenu: () => void;
  activeWorkspace?: any;
  workspaces?: any[];
  user?: any;
}

export const SideRail: React.FC<SideRailProps> = ({ 
  activeView, 
  onViewChange, 
  onOpenAddMenu, 
  activeWorkspace,
  workspaces = [],
  user
}) => {
  const { signOut } = useAuth();
  const router = useRouter();

  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'dms', icon: MessageSquare, label: 'DMs' },
    { id: 'activity', icon: Bell, label: 'Activity' },
    { id: 'files', icon: FileText, label: 'Files' },
    { id: 'huddles', icon: Headphones, label: 'Huddles' },
    { id: 'integrations', icon: Blocks, label: 'Integrations' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getDisplayName = () => {
    const rawName = user?.display_name || user?.user_metadata?.display_name || user?.email || 'U';
    if (rawName.includes('@')) {
      return rawName.split('@')[0];
    }
    return rawName;
  };

  const displayName = getDisplayName();

  return (
    <div className="w-[70px] h-full bg-[#121016] flex flex-col items-center py-4 shrink-0 border-r border-white/5">
      <div
        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-white mb-2 shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform overflow-hidden"
        onClick={() => onViewChange('home')}
      >
        {activeWorkspace?.logo_url ? (
          activeWorkspace.logo_url.startsWith('data:') ? (
            <img src={activeWorkspace.logo_url} alt={activeWorkspace.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{activeWorkspace.logo_url}</span>
          )
        ) : (
          <span>{activeWorkspace?.name?.substring(0, 2).toUpperCase() || 'DT'}</span>
        )}
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

      <div className="w-8 h-px bg-white/10 shrink-0" />

      {/* Workspaces List with Custom Scrollbar */}
      <div className="flex-1 w-full flex flex-col items-center gap-4 overflow-y-auto min-h-0 py-2 custom-scrollbar">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspace?.id;
          return (
            <button
              key={ws.id}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('ws', ws.id);
                window.location.href = url.toString();
              }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95 group relative overflow-hidden",
                isActive ? "ring-2 ring-primary bg-primary/20" : "bg-[#1e1a24] hover:bg-white/10"
              )}
              title={ws.name}
            >
              {isActive && (
                <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              )}
              {ws.logo_url ? (
                ws.logo_url.startsWith('data:') ? (
                  <img src={ws.logo_url} alt={ws.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">{ws.logo_url}</span>
                )
              ) : (
                <span>{ws.name.substring(0, 2).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.4);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
      `}</style>

      <div className="mt-auto flex flex-col items-center gap-4">
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-white/5 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-6 h-6" />
        </button>
        <button 
          onClick={onOpenAddMenu}
          className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
          title="Add"
        >
          <Plus className="w-6 h-6" />
        </button>
        <Avatar 
          onClick={() => onViewChange('profile')}
          className={cn(
            "w-9 h-9 rounded-lg cursor-pointer border ring-primary/20 hover:ring-2 transition-all",
            activeView === 'profile' ? "border-primary ring-2" : "border-white/10"
          )}
        >
          <AvatarImage src={user?.profile_picture_url || user?.avatar_url || ''} />
          <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
            {displayName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};