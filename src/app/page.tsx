'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const NAV_LINKS = ['Features', 'Solutions', 'Enterprise', 'Pricing'];

const FEATURES = [
  {
    icon: '⌘',
    title: 'Smart Channels',
    desc: 'Organise conversations by project, team, or topic. Keep every discussion focused and searchable.',
  },
  {
    icon: '◈',
    title: 'AI Smart Reply',
    desc: 'Gemini-powered suggestions surface the right response in one click. Stay in flow.',
  },
  {
    icon: '⬡',
    title: 'Huddle Meetings',
    desc: 'Jump into lightweight audio/video calls directly from any channel, no scheduling needed.',
  },
  {
    icon: '◎',
    title: 'Code Snippets',
    desc: 'First-class syntax highlighting for 40+ languages. Review code without leaving the chat.',
  },
  {
    icon: '⟡',
    title: 'Global Search',
    desc: 'Find any message, file, or thread across your entire workspace in milliseconds.',
  },
  {
    icon: '⬢',
    title: 'Integrations',
    desc: 'Connect GitHub, Jira, Figma, and 100+ tools. Everything in one command centre.',
  },
];

const STATS = [
  { value: '10M+', label: 'developers trust Codex Teams' },
  { value: '99.9%', label: 'uptime SLA' },
  { value: '< 50ms', label: 'message delivery' },
  { value: '256-bit', label: 'AES encryption' },
];

const LOGOS = ['GitHub', 'Vercel', 'Stripe', 'Linear', 'Supabase', 'Figma', 'Notion', 'AWS'];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Animated hero background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dots: { x: number; y: number; vx: number; vy: number }[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));

    let t = 0;
    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Orbs
      [
        { x: canvas.width * 0.2, y: canvas.height * 0.4, r: 350, h: 172 },
        { x: canvas.width * 0.75, y: canvas.height * 0.6, r: 280, h: 190 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1, r: 200, h: 155 },
      ].forEach((o, i) => {
        const ox = o.x + Math.sin(t * 0.0003 + i) * 80;
        const oy = o.y + Math.cos(t * 0.0004 + i) * 50;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r);
        g.addColorStop(0, `hsla(${o.h},80%,45%,0.15)`);
        g.addColorStop(1, `hsla(${o.h},60%,25%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Grid
      ctx.strokeStyle = 'rgba(20,180,160,0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Dots + connections
      dots.forEach(d => {
        d.x = (d.x + d.vx + canvas.width) % canvas.width;
        d.y = (d.y + d.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,210,190,0.35)';
        ctx.fill();
      });

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.strokeStyle = `rgba(0,210,190,${0.06 * (1 - d / 90)})`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ background: '#020d0f', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#e0f7f4', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: scrolled ? 'rgba(2,13,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,210,180,0.1)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, border: '1px solid rgba(0,210,180,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ color: '#00d4b4', fontSize: 12, fontFamily: 'monospace' }}>{'>'}_</span>
            <div style={{ position: 'absolute', top: -1, right: -1, width: 5, height: 5, background: '#00d4b4' }} />
          </div>
          <span style={{ color: '#e0f7f4', fontSize: 16, letterSpacing: 4, fontWeight: 600, fontFamily: 'monospace' }}>CODEX TEAMS</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 36 }}>
          {NAV_LINKS.map(l => (
            <a key={l} href="#" style={{ color: 'rgba(224,247,244,0.6)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#00d4b4'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(224,247,244,0.6)'}
            >{l}</a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ color: 'rgba(224,247,244,0.7)', fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
          <Link href="/login" style={{
            padding: '9px 20px', background: 'rgba(0,210,180,0.12)',
            border: '1px solid rgba(0,210,180,0.5)', color: '#00d4b4',
            fontSize: 13, textDecoration: 'none', letterSpacing: 1,
            transition: 'all 0.2s', fontFamily: 'monospace',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(0,210,180,0.22)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(0,210,180,0.12)'; }}
          >Get started →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 800, padding: '0 24px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', border: '1px solid rgba(0,210,180,0.3)', marginBottom: 36, background: 'rgba(0,210,180,0.05)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4b4', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, letterSpacing: 2, color: 'rgba(0,210,180,0.8)', fontFamily: 'monospace' }}>NOW WITH AI SMART REPLY</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 24px', letterSpacing: -2 }}>
            Where engineering<br />
            <span style={{ color: '#00d4b4', position: 'relative' }}>
              teams ship faster
              <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M0 6 Q75 1 150 5 Q225 9 300 4" stroke="#00d4b4" strokeWidth="2" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(224,247,244,0.55)', lineHeight: 1.7, marginBottom: 44, maxWidth: 560, margin: '0 auto 44px' }}>
            Real-time messaging built for developers. AI summaries, code review threads, and deep integrations with your entire stack.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              padding: '14px 32px', background: '#00d4b4',
              color: '#020d0f', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', letterSpacing: 0.5,
              transition: 'all 0.2s', display: 'inline-block',
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = '#00f0cc'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = '#00d4b4'; }}
            >Start for free</Link>
            <a href="#features" style={{
              padding: '14px 32px', background: 'transparent',
              border: '1px solid rgba(224,247,244,0.2)', color: 'rgba(224,247,244,0.8)',
              fontSize: 15, textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(224,247,244,0.5)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'rgba(224,247,244,0.2)'; }}
            >▶ Watch demo</a>
          </div>

          {/* Social proof */}
          <p style={{ marginTop: 48, fontSize: 13, color: 'rgba(224,247,244,0.3)', letterSpacing: 1 }}>
            TRUSTED BY ENGINEERING TEAMS AT
          </p>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {LOGOS.map(l => (
              <span key={l} style={{ fontSize: 13, color: 'rgba(224,247,244,0.2)', fontWeight: 600, letterSpacing: 1 }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(0,210,180,0.3)', fontFamily: 'monospace' }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(0,210,180,0.3), transparent)' }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '60px 40px', borderTop: '1px solid rgba(0,210,180,0.08)', borderBottom: '1px solid rgba(0,210,180,0.08)' }}>
        <div className="stats-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          {STATS.map(s => (
            <div key={s.value} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#00d4b4', letterSpacing: -1, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(224,247,244,0.4)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p style={{ color: 'rgba(0,210,180,0.6)', fontSize: 11, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 16 }}>// features</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, margin: 0, letterSpacing: -1 }}>
              Everything your team needs.<br />
              <span style={{ color: 'rgba(224,247,244,0.4)', fontWeight: 400 }}>Nothing it doesn't.</span>
            </h2>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title}
                onMouseEnter={() => setActiveFeature(i)}
                style={{
                  padding: '36px 32px',
                  background: activeFeature === i ? 'rgba(0,210,180,0.06)' : 'rgba(255,255,255,0.02)',
                  border: activeFeature === i ? '1px solid rgba(0,210,180,0.2)' : '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.3s', cursor: 'default',
                }}>
                <div style={{ fontSize: 28, marginBottom: 16, color: '#00d4b4' }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 10px', color: '#e0f7f4' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(224,247,244,0.45)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APP PREVIEW MOCKUP ── */}
      <section style={{ padding: '60px 40px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Mock chat UI */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,210,180,0.12)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            {/* Window chrome */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(0,210,180,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c940' }} />
              <span style={{ marginLeft: 16, fontSize: 12, color: 'rgba(224,247,244,0.3)', fontFamily: 'monospace' }}># engineering — Codex Teams Workspace</span>
            </div>
            <div className="chat-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr' }}>
              {/* Sidebar */}
              <div className="hidden md:block" style={{ borderRight: '1px solid rgba(0,210,180,0.08)', padding: '20px 0' }}>
                <div style={{ padding: '4px 20px', fontSize: 11, letterSpacing: 2, color: 'rgba(0,210,180,0.4)', marginBottom: 8 }}>CHANNELS</div>
                {['# general', '# engineering', '# deployments', '# code-review', '# incidents'].map((c, i) => (
                  <div key={c} style={{
                    padding: '6px 20px', fontSize: 13, cursor: 'pointer',
                    color: i === 1 ? '#00d4b4' : 'rgba(224,247,244,0.4)',
                    background: i === 1 ? 'rgba(0,210,180,0.08)' : 'transparent',
                    borderLeft: i === 1 ? '2px solid #00d4b4' : '2px solid transparent',
                  }}>{c}</div>
                ))}
              </div>
              {/* Messages */}
              <div style={{ padding: 24 }}>
                {[
                  { user: 'AK', name: 'Arjun K', msg: 'PR #423 is ready for review — refactored the auth middleware', time: '10:42 AM', color: '#7c6fcd' },
                  { user: 'SR', name: 'Sneha R', msg: 'On it! Left some comments on the token refresh logic', time: '10:44 AM', color: '#00d4b4' },
                  { user: 'AI', name: 'Codex Teams AI', msg: '✦ Summary: Auth middleware refactor adds token rotation support. 2 files changed, 48 insertions. Review requested on error handling path.', time: '10:44 AM', color: '#f59e0b', ai: true },
                ].map(m => (
                  <div key={m.user} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#020d0f', flexShrink: 0 }}>{m.user}</div>
                    <div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: m.color }}>{m.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(224,247,244,0.25)' }}>{m.time}</span>
                      </div>
                      <div style={{
                        fontSize: 13, color: m.ai ? 'rgba(224,247,244,0.6)' : 'rgba(224,247,244,0.75)',
                        lineHeight: 1.6,
                        background: m.ai ? 'rgba(245,158,11,0.06)' : 'transparent',
                        padding: m.ai ? '8px 12px' : 0,
                        border: m.ai ? '1px solid rgba(245,158,11,0.15)' : 'none',
                        borderRadius: m.ai ? 2 : 0,
                      }}>{m.msg}</div>
                    </div>
                  </div>
                ))}
                {/* Input bar */}
                <div style={{ marginTop: 16, padding: '10px 16px', border: '1px solid rgba(0,210,180,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'rgba(0,210,180,0.4)', fontFamily: 'monospace' }}>{'>'}</span>
                  <span style={{ fontSize: 13, color: 'rgba(224,247,244,0.25)' }}>Message #engineering</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '100px 40px', borderTop: '1px solid rgba(0,210,180,0.08)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,180,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(0,210,180,0.6)', fontSize: 11, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 24 }}>// ready to deploy?</p>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, margin: '0 0 20px', letterSpacing: -1 }}>
            Your team's command centre<br />awaits.
          </h2>
          <p style={{ color: 'rgba(224,247,244,0.4)', fontSize: 17, marginBottom: 44, maxWidth: 480, margin: '0 auto 44px' }}>
            Free for teams up to 10. No credit card required. Production-ready in minutes.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/login" style={{
              padding: '16px 40px', background: '#00d4b4',
              color: '#020d0f', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', transition: 'background 0.2s',
            }}>Get started free</Link>
            <a href="#" style={{
              padding: '16px 32px', border: '1px solid rgba(224,247,244,0.15)',
              color: 'rgba(224,247,244,0.6)', fontSize: 15,
              textDecoration: 'none', transition: 'all 0.2s',
            }}>Talk to sales</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px', borderTop: '1px solid rgba(0,210,180,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, letterSpacing: 3, fontFamily: 'monospace', color: 'rgba(0,210,180,0.3)' }}>CODEX TEAMS © 2025</span>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Privacy', 'Terms', 'Security', 'Status'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(224,247,244,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'rgba(0,210,180,0.7)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(224,247,244,0.25)'}
            >{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(224,247,244,0.15)', letterSpacing: 2 }}>✦ POWERED BY DATA CONNECT</span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .chat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
