'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/database';
import { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123'); // Default for simplified prototype flow
  const [isLoading, setIsLoading] = useState(false);
  const { auth } = useAuth();
  const { toast } = useToast();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    try {
      // Simplified "Continue" logic: try to sign in, if not found, create account
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/invalid-email') {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: "Account Created", description: "Welcome to DevTalk!" });
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

  const handleGoogleSignIn = () => {
    toast({ title: "Google Sign-In", description: "This feature is coming soon to the DevTalk prototype." });
  };

  const handleAppleSignIn = () => {
    toast({ title: "Apple Sign-In", description: "This feature is coming soon to the DevTalk prototype." });
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center pt-12 px-4 font-sans text-[#1d1c1d]">
      {/* Header / Logo */}
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-[#4a154b] rounded flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">D</span>
        </div>
        <span className="text-2xl font-black tracking-tight flex items-center">
          devtalk
        </span>
      </div>

      <div className="w-full max-w-[400px] flex flex-col items-center text-center">
        <h1 className="text-[48px] font-bold tracking-tight leading-[1.1] mb-2">
          First, enter your email
        </h1>
        <p className="text-[18px] text-[#454245] mb-8">
          We suggest using the <span className="font-bold">email address you use at work.</span>
        </p>

        <form onSubmit={handleContinue} className="w-full space-y-4">
          <Input 
            type="email" 
            placeholder="name@work-email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[44px] border-[#868685] rounded-[4px] text-[18px] focus-visible:ring-[#1264a3] focus-visible:ring-1"
            required 
          />
          <Button 
            type="submit" 
            className="w-full h-[44px] bg-[#4a154b] hover:bg-[#5d1a5e] text-white font-bold text-[18px] rounded-[4px] transition-colors" 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
          </Button>
        </form>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="h-px bg-[#dddddd] flex-1" />
          <span className="text-[15px] font-medium text-[#454245]">OR</span>
          <div className="h-px bg-[#dddddd] flex-1" />
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mb-10">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn}
            className="h-[44px] border-[#dddddd] border-[2px] rounded-[4px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#f8f8f8]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAppleSignIn}
            className="h-[44px] border-[#dddddd] border-[2px] rounded-[4px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#f8f8f8]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.75.9.01 2.1-.83 3.6-.76 1.88.07 3.33.87 4.14 2.3-3.74 2.26-3.13 7.32.55 9.1-.73 1.84-1.85 3.58-3.37 5.58zM12.03 7.25c-.02-4.07 3.35-7.44 7.26-7.25.35 3.99-3.37 7.42-7.26 7.25z"/>
            </svg>
            Apple
          </Button>
        </div>

        <div className="text-[13px] text-[#454245] leading-relaxed max-w-[350px]">
          By continuing, you’re agreeing to our <span className="text-[#1264a3] cursor-pointer hover:underline">Main Services Agreement</span>, <span className="text-[#1264a3] cursor-pointer hover:underline">User Terms of Service</span>, and <span className="text-[#1264a3] cursor-pointer hover:underline">DevTalk Supplemental Terms</span>. Additional disclosures are available in our <span className="text-[#1264a3] cursor-pointer hover:underline">Privacy Policy</span> and <span className="text-[#1264a3] cursor-pointer hover:underline">Cookie Policy</span>.
        </div>

        <div className="mt-8 text-[15px] text-[#454245]">
          Already using DevTalk? <Link href="/login" className="text-[#1264a3] font-bold hover:underline">Sign in to an existing workspace</Link>
        </div>
      </div>

      <footer className="mt-auto pb-8 flex gap-6 text-[13px] text-[#696969] font-medium">
        <span className="cursor-pointer hover:text-[#1d1c1d]">Privacy & Terms</span>
        <span className="cursor-pointer hover:text-[#1d1c1d]">Contact Us</span>
        <span className="cursor-pointer hover:text-[#1d1c1d] flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Change region
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-9" />
          </svg>
        </span>
      </footer>
    </div>
  );
}
