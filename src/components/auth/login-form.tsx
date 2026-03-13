'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/database';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Terminal, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Auth Not Initialized",
        description: "Firebase service is still warming up. Please wait a moment.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For prototypes, we try to login first, if fail due to user not found, we create the user
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
          // Attempt registration for better prototype flow
          await createUserWithEmailAndPassword(auth, email, password);
          toast({
            title: "Account Created",
            description: "New developer profile established.",
          });
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymous = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Guest Access Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0c] p-4 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] animate-blob animation-delay-4000" />

      <Card className="w-full max-w-md bg-[#1a1d21]/80 backdrop-blur-2xl border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500 rounded-3xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
        
        <CardHeader className="space-y-4 pt-10 pb-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-primary/20 shadow-xl shadow-primary/10">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white uppercase tracking-wider">DevTalk</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Connect your workspace and start building together.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Terminal</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="dev@devtalk.app" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border-white/10 h-12 px-4 focus-visible:ring-primary/40 rounded-xl"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Security Key</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/40 border-white/10 h-12 px-4 focus-visible:ring-primary/40 rounded-xl"
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-95" 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-6 pb-10">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-[#1a1d21] px-4 text-white/20">or deploy as</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-[11px] uppercase tracking-[0.2em] gap-3 rounded-xl transition-all active:scale-95" 
            onClick={handleAnonymous}
            disabled={isLoading}
          >
            <Shield className="w-4 h-4 text-green-500" />
            Guest Contributor
          </Button>

          <p className="text-[10px] text-center text-muted-foreground font-medium px-8 leading-relaxed">
            By authenticating, you agree to our <span className="text-white hover:underline cursor-pointer">Protocol Terms</span> and <span className="text-white hover:underline cursor-pointer">Data Policy</span>.
          </p>
        </CardFooter>
      </Card>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-white/10 uppercase">
        <Sparkles className="w-3 h-3" />
        <span>Powered by Data Connect</span>
      </div>
    </div>
  );
}
