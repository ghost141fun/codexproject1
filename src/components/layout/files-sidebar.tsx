"use client";

import React, { useRef } from 'react';
import { Search, Plus, FileText, Image as ImageIcon, Code, File, FolderOpen, Clock, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilesSidebarProps {
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  fileCount: number;
  onUpload: (files: FileList) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const FilesSidebar: React.FC<FilesSidebarProps> = ({
  activeCategory,
  onCategorySelect,
  fileCount,
  onUpload,
  searchQuery,
  onSearchChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', icon: FolderOpen, label: 'All Files' },
    { id: 'recent', icon: Clock, label: 'Recent' },
    { id: 'favorites', icon: Star, label: 'Favorites' },
  ];

  const types = [
    { id: 'image', icon: ImageIcon, label: 'Images' },
    { id: 'document', icon: FileText, label: 'Documents' },
    { id: 'code', icon: Code, label: 'Source Code' },
    { id: 'other', icon: File, label: 'Others' },
  ];

  return (
    <div className="w-64 h-full flex bg-[#19171d] flex-col overflow-hidden border-r border-white/5">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-xl font-bold mb-4">Files</h2>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 bg-white/5 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-white/20"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-all group",
                  activeCategory === cat.id
                    ? "bg-primary/20 text-white font-medium"
                    : "text-[#d1d2d3] hover:bg-white/10"
                )}
              >
                <cat.icon className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                <span className="flex-1 text-left">{cat.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              File Types
            </h3>
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => onCategorySelect(type.id)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-all group",
                  activeCategory === type.id
                    ? "bg-primary/20 text-white font-medium"
                    : "text-[#d1d2d3] hover:bg-white/10"
                )}
              >
                <type.icon className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                <span className="flex-1 text-left">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { if (e.target.files?.length) { onUpload(e.target.files); e.target.value = ''; } }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 w-full px-3 py-2 mt-4 rounded-md text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Upload new file</span>
          </button>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/5 bg-black/10">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
            <span>Storage Used</span>
            <span>{Math.round(fileCount * 1.2)} MB / 5 GB</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min((fileCount * 1.2 / 5000) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};