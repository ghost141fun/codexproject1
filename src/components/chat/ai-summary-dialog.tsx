"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { summarizeConversation } from "@/ai/flows/summarize-conversation";
import { Message } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface AiSummaryDialogProps {
  messages: Message[];
  channelName: string;
}

export const AiSummaryDialog: React.FC<AiSummaryDialogProps> = ({ messages, channelName }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setLoading(true);
    try {
      const input = {
        messages: messages.map(m => ({
          author: m.senderName,
          content: m.content,
          timestamp: m.timestamp
        }))
      };
      const result = await summarizeConversation(input);
      setSummary(result.summary);
    } catch (error) {
      console.error("Summary error:", error);
      toast({
        title: "AI Failed",
        description: "Could not generate summary at this time.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast({ title: "Copied!", description: "Summary copied to clipboard." });
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setSummary(null)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
          <Sparkles className="w-4 h-4 text-primary" />
          Summarize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Channel Insight: #{channelName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            An AI-generated summary of recent activity and key points discussed in this channel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 min-h-[150px] flex flex-col items-center justify-center space-y-4">
          {!summary && !loading && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Get a quick overview of what happened in this channel recently.
              </p>
              <Button onClick={handleSummarize} className="bg-primary text-primary-foreground">
                Generate Summary
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing {messages.length} messages...</p>
            </div>
          )}

          {summary && !loading && (
            <div className="w-full space-y-4">
              <div className="bg-background/50 border border-border p-4 rounded-lg text-sm leading-relaxed text-foreground/90">
                {summary}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="default" size="sm" onClick={handleSummarize}>
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};