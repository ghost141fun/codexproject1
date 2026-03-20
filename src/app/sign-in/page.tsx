'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/database';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { supabase } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const dots: { x: number; y: number; vx: number; vy: number }[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    }));
    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      [
        { x: canvas.width * 0.2, y: canvas.height * 0.4, r: 350, h: 172 },
        { x: canvas.width * 0.75, y: canvas.height * 0.6, r: 280, h: 190 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1, r: 200, h: 155 },
      ].forEach((o, i) => {
        const ox = o.x + Math.sin(t * 0.0003 + i) * 80;
        const oy = o.y + Math.cos(t * 0.0004 + i) * 50;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, `hsla(${o.h},80%,45%,0.1)`);
        g.addColorStop(1, `hsla(${o.h},60%,25%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ox, oy, o.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = 'rgba(0,210,180,0.03)'; ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y < canvas.height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      dots.forEach(d => {
        d.x = (d.x + d.vx + canvas.width) % canvas.width;
        d.y = (d.y + d.vy + canvas.height) % canvas.height;
        ctx.beginPath(); ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,210,190,0.2)'; ctx.fill();
      });
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(0,210,190,${0.04 * (1 - d / 120)})`;
            ctx.lineWidth = 0.4; ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !supabase) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: error.message });
      return;
    }

    toast({ title: 'Welcome back!', description: 'Signing you into your workspace...' });
    router.push('/workspace');
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleApple = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020d0f] flex flex-col items-center pt-12 px-4 font-sans text-white overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-[#00d4b4] rounded flex items-center justify-center">
            <span className="text-[#020d0f] font-bold text-lg leading-none">D</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-white">devtalk</span>
        </div>

        <div className="w-full flex flex-col items-center text-center">
            <h1 className="text-[48px] font-bold tracking-tight leading-[1.1] mb-2 text-white">
              Welcome back
            </h1>
            <p className="text-[18px] text-white/60 mb-8">
              Sign in to access your workspace.
            </p>
            <form onSubmit={handleSignIn} className="w-full space-y-4">
              <Input type="email" placeholder="name@work-email.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus
                className="h-[44px] bg-white/5 border-white/10 rounded-[4px] text-[18px] focus-visible:ring-[#00d4b4] focus-visible:ring-1 text-white placeholder:text-white/20"
              />
              <Input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="h-[44px] bg-white/5 border-white/10 rounded-[4px] text-[18px] focus-visible:ring-[#00d4b4] focus-visible:ring-1 text-white placeholder:text-white/20"
              />
              <Button type="submit" disabled={isLoading} className="w-full h-[44px] bg-[#00d4b4] hover:bg-[#00f0cc] text-[#020d0f] font-bold text-[18px] rounded-[4px]">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>

            <div className="w-full flex items-center gap-4 my-6">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[15px] font-medium text-white/40">OR</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div className="w-full grid grid-cols-2 gap-3 mb-10">
              <Button variant="outline" onClick={handleGoogle} className="h-[44px] border-white/10 bg-white/5 rounded-[4px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-white/10 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </Button>
              <Button variant="outline" onClick={handleApple} className="h-[44px] border-white/10 bg-white/5 rounded-[4px] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-white/10 text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.75.9.01 2.1-.83 3.6-.76 1.88.07 3.33.87 4.14 2.3-3.74 2.26-3.13 7.32.55 9.1-.73 1.84-1.85 3.58-3.37 5.58zM12.03 7.25c-.02-4.07 3.35-7.44 7.26-7.25.35 3.99-3.37 7.42-7.26 7.25z"/></svg>
                Apple
              </Button>
            </div>

            <div className="mt-8 text-[15px] text-white/60">
              Don't have an account?{' '}
              <Link href="/login" className="text-[#00d4b4] font-bold hover:underline">
                Sign up
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
