'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Send, Smile, Video, Mic, AtSign, ChevronDown,
  X, Reply, Trash2, Paperclip, Image, Check, RefreshCw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type UserStatus  = 'online' | 'away' | 'busy' | 'offline';
type FormatType  = 'bold' | 'italic' | 'strike';
type SendState   = 'idle' | 'sending' | 'sent';

export interface Person {
  id: string; name: string; avatar: string;
  color: string; status: UserStatus; role?: string;
}

export interface ReplyTarget {
  id: string; senderId: string; senderName: string; text: string;
}

export interface SentMessage {
  id: string; text: string; formattedText: string;
  timestamp: Date; attachmentType?: 'audio'|'video'|'file'|'image';
  attachmentName?: string; attachmentUrl?: string;
  replyTo?: ReplyTarget; formats: FormatType[];
}

export interface RichTextEditorProps {
  placeholder?:  string;
  people?:       Person[];
  replyTo?:      ReplyTarget | null;
  onClearReply?: () => void;
  onSend?:       (msg: SentMessage) => void;
}

const SC: Record<UserStatus, string> = {
  online:'#10b981', away:'#f59e0b', busy:'#ef4444', offline:'#6b7280',
};

// ── Emoji list ─────────────────────────────────────────────────────────────────
const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😍','😘','🥰','😗',
  '😚','☺️','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','😐','😑','😶',
  '😏','😒','🙄','😬','🤥','😔','😪','😴','😷','🤒','🤕','😎','🤓','🧐','😕','😟',
  '🙁','☹️','😮','😲','😳','🥺','😦','😧','😨','😰','😢','😭','😱','😖','😣','😞',
  '😩','😫','🥱','😤','😡','😠','🤬','😈','👍','👎','👏','🙌','🤝','✊','👊','✋',
  '👋','🤙','💪','❤️','🧡','💛','💚','💙','💜','🖤','💔','🔥','⭐','✨','💫','🎉',
  '🎊','🎈','🏆','🥇','🚀','💡','🔑','🎯','💎','👑','🤝','💯','✅','❌','⚡','🌊',
];

// ── Terminal ───────────────────────────────────────────────────────────────────
interface TermLine { type:'input'|'output'|'error'|'info'|'system'; text:string; }

function evalCmd(raw: string): string[] {
  const parts = raw.trim().split(' ');
  const cmd   = parts[0].toLowerCase();
  const arg   = parts.slice(1).join(' ');
  const map: Record<string, string[]> = {
    help:   ['Commands: help, ls, ls -la, pwd, whoami, date, uptime, echo, ping, curl, cat, git, node, npm, clear'],
    pwd:    ['/workspace/devtalk'],
    whoami: ['devtalk-user'],
    date:   [new Date().toString()],
    uptime: ['up 3 days, 14 hours, 22 minutes'],
    clear:  ['__CLEAR__'],
    ls:     ['README.md  package.json  src/  public/  node_modules/  .gitignore  tailwind.config.ts'],
  };
  if (cmd==='echo') return [arg||''];
  if (cmd==='ping') return ['PING '+(arg||'localhost')+': 56 bytes','64 bytes: icmp_seq=0 ttl=64 time=0.42 ms','1 packet, 0% loss'];
  if (cmd==='cat')  return arg ? ['{"name":"devtalk","version":"0.1.0"}'] : ['cat: missing operand'];
  if (cmd==='curl') return arg ? ['{"status":"ok","url":"'+arg+'"}'] : ['curl: try curl <url>'];
  if (cmd==='node') return ['Node.js v20.11.0 — type .help'];
  if (cmd==='npm' && parts[1]==='install') return ['added 847 packages in 4.2s'];
  if (cmd==='npm')  return ['Usage: npm <command>'];
  if (cmd==='git' && parts[1]==='status') return ['On branch main','nothing to commit, working tree clean'];
  if (cmd==='git' && parts[1]==='log')   return ['commit a1b2c3d (HEAD -> main)','Author: You','feat: rich text editor'];
  if (cmd==='ls' && parts.includes('-la')) return ['total 72','drwxr-xr-x src/','drwxr-xr-x public/','-rw-r--r-- package.json'];
  return map[cmd] || ['bash: '+raw+': command not found'];
}

function fmtSecs(s: number) { return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }

// ─────────────────────────────────────────────────────────────────────────────
export function RichTextEditor({
  placeholder = 'Message...',
  people      = [],
  replyTo     = null,
  onClearReply,
  onSend,
}: RichTextEditorProps) {

  const [text,        setText]        = useState('');
  const [formats,     setFormats]     = useState<Set<FormatType>>(new Set());
  const [isList,      setIsList]      = useState<'bullet'|'ordered'|null>(null);
  const [isQuote,     setIsQuote]     = useState(false);
  const [isCode,      setIsCode]      = useState(false);
  const [isBlock,     setIsBlock]     = useState(false);
  const [sendState,   setSendState]   = useState<SendState>('idle');
  const [inlineFmts,  setInlineFmts]  = useState<{s:number;e:number;f:FormatType;t:string}[]>([]);

  // Panels
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [mentionQ,    setMentionQ]    = useState('');
  const [mentionIdx,  setMentionIdx]  = useState(0);
  const [showTerminal,setShowTerminal]= useState(false);
  const [showAttach,  setShowAttach]  = useState(false);

  // Terminal
  const [termLines,   setTermLines]   = useState<TermLine[]>([
    { type:'system', text:'DevTalk Terminal — type help for commands' },
    { type:'info',   text:'Type send to paste output into message.' },
  ]);
  const [termInput,   setTermInput]   = useState('');
  const [termHist,    setTermHist]    = useState<string[]>([]);
  const [termHistIdx, setTermHistIdx] = useState(-1);

  // Voice
  const [voiceState,  setVoiceState]  = useState<'idle'|'rec'|'preview'>('idle');
  const [voiceSecs,   setVoiceSecs]   = useState(0);
  const [voiceBlob,   setVoiceBlob]   = useState<Blob|null>(null);
  const [voiceBars,   setVoiceBars]   = useState<number[]>(Array(24).fill(4));
  const voiceMR     = useRef<MediaRecorder|null>(null);
  const voiceChunks = useRef<Blob[]>([]);
  const voiceTimerR = useRef<ReturnType<typeof setInterval>|null>(null);
  const voiceBarR   = useRef<ReturnType<typeof setInterval>|null>(null);

  // Video
  const [videoState,  setVideoState]  = useState<'idle'|'preview'|'rec'|'done'>('idle');
  const [videoSecs,   setVideoSecs]   = useState(0);
  const [videoBlob,   setVideoBlob]   = useState<Blob|null>(null);
  const videoStream = useRef<MediaStream|null>(null);
  const videoMR     = useRef<MediaRecorder|null>(null);
  const videoChunks = useRef<Blob[]>([]);
  const videoTimerR = useRef<ReturnType<typeof setInterval>|null>(null);
  const liveVidRef  = useRef<HTMLVideoElement>(null);
  const prevVidRef  = useRef<HTMLVideoElement>(null);

  // Refs
  const taRef       = useRef<HTMLTextAreaElement>(null);
  const termInRef   = useRef<HTMLInputElement>(null);
  const termBotRef  = useRef<HTMLDivElement>(null);
  const emojiRef    = useRef<HTMLDivElement>(null);
  const attachRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const imgRef      = useRef<HTMLInputElement>(null);

  // Outside-click close
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (emojiRef.current  && !emojiRef.current.contains(e.target as Node))  setShowEmoji(false);
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) setShowAttach(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Auto-resize
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160)+'px';
  }, [text]);

  // Terminal scroll
  useEffect(() => { termBotRef.current?.scrollIntoView({behavior:'smooth'}); }, [termLines]);

  // Video stream attach
  useEffect(() => {
    if (videoState==='preview' && liveVidRef.current && videoStream.current)
      liveVidRef.current.srcObject = videoStream.current;
  }, [videoState]);

  // @mention trigger
  useEffect(() => {
    const i = text.lastIndexOf('@');
    if (i>=0) {
      const after = text.slice(i+1);
      if (!after.includes(' ') && after.length<=20) { setMentionQ(after); setShowMention(true); setMentionIdx(0); return; }
    }
    setShowMention(false);
  }, [text]);

  // Cleanup
  useEffect(() => () => {
    videoStream.current?.getTracks().forEach(t=>t.stop());
    if (voiceTimerR.current) clearInterval(voiceTimerR.current);
    if (voiceBarR.current)   clearInterval(voiceBarR.current);
    if (videoTimerR.current) clearInterval(videoTimerR.current);
  }, []);

  // ── Format ──────────────────────────────────────────────────────────────────
  function applyFormat(f: FormatType) {
    const ta = taRef.current; if (!ta) { toggleFmt(f); return; }
    const {selectionStart:s, selectionEnd:e} = ta;
    if (s===e) { toggleFmt(f); return; }
    const token = f==='bold'?'**':f==='italic'?'_':'~~';
    const sel = text.slice(s,e);
    if (sel.startsWith(token)&&sel.endsWith(token)) {
      const inner = sel.slice(token.length,-token.length);
      setText(text.slice(0,s)+inner+text.slice(e));
      setTimeout(()=>{ta.selectionStart=s;ta.selectionEnd=s+inner.length;ta.focus();},0);
    } else {
      setInlineFmts(prev=>[...prev,{s,e,f,t:sel}]);
      setTimeout(()=>{ta.selectionStart=s;ta.selectionEnd=e;ta.focus();},0);
    }
  }

  function toggleFmt(f: FormatType) {
    setFormats(prev=>{const n=new Set(prev);n.has(f)?n.delete(f):n.add(f);return n;});
    taRef.current?.focus();
  }

  function handleLink() {
    const url = window.prompt('Enter URL:');
    if (!url) return;
    const ta = taRef.current;
    if (ta) {
      const {selectionStart:s,selectionEnd:e} = ta;
      const label = text.slice(s,e)||url;
      setText(text.slice(0,s)+'['+label+']('+url+')'+text.slice(e));
    } else { setText(p=>p+'[link]('+url+')'); }
    setTimeout(()=>taRef.current?.focus(),0);
  }

  function insertEmoji(emoji: string) {
    const ta = taRef.current;
    if (ta) {
      const s = ta.selectionStart;
      setText(text.slice(0,s)+emoji+text.slice(s));
      setTimeout(()=>{ta.selectionStart=ta.selectionEnd=s+emoji.length;ta.focus();},0);
    } else setText(p=>p+emoji);
    setShowEmoji(false);
  }

  function insertMention(name: string) {
    const i = text.lastIndexOf('@');
    setText(text.slice(0,i)+'@'+name+' ');
    setShowMention(false); setMentionQ('');
    taRef.current?.focus();
  }

  function buildText(): string {
    let t = text;
    // Apply inline selection formats
    const sorted = [...inlineFmts].sort((a,b)=>b.s-a.s);
    let chars = t.split('');
    for (const r of sorted) {
      const tok = r.f==='bold'?'**':r.f==='italic'?'_':'~~';
      chars.splice(r.e,0,...tok.split(''));
      chars.splice(r.s,0,...tok.split(''));
    }
    t = chars.join('');
    // Whole-message formats
    if (formats.has('bold'))   t = '**'+t+'**';
    if (formats.has('italic')) t = '_'+t+'_';
    if (formats.has('strike')) t = '~~'+t+'~~';
    if (isCode)  t = '`'+t+'`';
    if (isQuote) t = '> '+t.split('\n').join('\n> ');
    if (isBlock) t = '```\n'+t+'\n```';
    if (isList==='bullet')  t = text.split('\n').map(l=>'• '+l).join('\n');
    if (isList==='ordered') t = text.split('\n').map((l,i)=>(i+1)+'. '+l).join('\n');
    return t;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey||e.metaKey) {
      if (e.key==='b'){e.preventDefault();applyFormat('bold');return;}
      if (e.key==='i'){e.preventDefault();applyFormat('italic');return;}
    }
    if (showMention) {
      const fp = filteredPeople();
      if (e.key==='ArrowDown'){e.preventDefault();setMentionIdx(i=>Math.min(i+1,fp.length-1));return;}
      if (e.key==='ArrowUp')  {e.preventDefault();setMentionIdx(i=>Math.max(i-1,0));return;}
      if (e.key==='Enter'||e.key==='Tab'){e.preventDefault();if(fp[mentionIdx])insertMention(fp[mentionIdx].name);return;}
      if (e.key==='Escape')   {setShowMention(false);return;}
    }
    if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();doSend();}
  }

  function doSend() {
    if (!text.trim()) return;
    setSendState('sending');
    const msg: SentMessage = {
      id:'msg-'+Date.now(), text:text.trim(),
      formattedText:buildText(), timestamp:new Date(),
      formats:Array.from(formats), replyTo:replyTo||undefined,
    };
    setTimeout(()=>{
      onSend?.(msg); setSendState('sent');
      setTimeout(()=>setSendState('idle'),1600);
    },150);
    setText(''); setFormats(new Set()); setInlineFmts([]);
    setIsList(null); setIsCode(false); setIsQuote(false); setIsBlock(false);
    onClearReply?.();
  }

  function handleFile(file: File, type:'file'|'image') {
    const url = URL.createObjectURL(file);
    onSend?.({ id:'msg-'+Date.now(), text:(type==='image'?'📷 ':'📎 ')+file.name,
      formattedText:(type==='image'?'📷 ':'📎 ')+file.name,
      timestamp:new Date(), formats:[], attachmentType:type,
      attachmentName:file.name, attachmentUrl:url });
    setShowAttach(false);
  }

  // ── Terminal ──────────────────────────────────────────────────────────────
  function sendTermOutput() {
    const out = termLines.filter(l=>l.type==='output').map(l=>l.text).join('\n');
    if (out) { onSend?.({id:'msg-'+Date.now(),text:'```bash\n'+out+'\n```',formattedText:'```bash\n'+out+'\n```',timestamp:new Date(),formats:[]}); setShowTerminal(false); }
  }

  function runTerm() {
    const cmd = termInput.trim(); if (!cmd) return;
    setTermHist(h=>[cmd,...h.slice(0,49)]); setTermHistIdx(-1); setTermInput('');
    if (cmd==='send'){sendTermOutput();return;}
    const results = evalCmd(cmd);
    if (results[0]==='__CLEAR__'){setTermLines([{type:'system',text:'Cleared.'}]);return;}
    setTermLines(prev=>[...prev,{type:'input',text:'$ '+cmd},...results.map(r=>({type:'output' as const,text:r}))]);
    setTimeout(()=>termInRef.current?.focus(),50);
  }

  function termKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key==='Enter') runTerm();
    if (e.key==='ArrowUp')   {e.preventDefault();const i=Math.min(termHistIdx+1,termHist.length-1);setTermHistIdx(i);setTermInput(termHist[i]??'');}
    if (e.key==='ArrowDown') {e.preventDefault();const i=Math.max(termHistIdx-1,-1);setTermHistIdx(i);setTermInput(i===-1?'':(termHist[i]??''));}
  }

  // ── Voice ────────────────────────────────────────────────────────────────
  async function startVoice() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(stream);
      voiceChunks.current=[];
      mr.ondataavailable=e=>voiceChunks.current.push(e.data);
      mr.onstop=()=>{ setVoiceBlob(new Blob(voiceChunks.current,{type:'audio/webm'})); setVoiceState('preview'); stream.getTracks().forEach(t=>t.stop()); };
      mr.start(100); voiceMR.current=mr; setVoiceState('rec'); setVoiceSecs(0);
      voiceTimerR.current=setInterval(()=>setVoiceSecs(s=>s+1),1000);
      voiceBarR.current=setInterval(()=>setVoiceBars(Array.from({length:24},()=>Math.random()*28+4)),120);
    } catch { alert('Microphone access denied.'); }
  }
  function stopVoice() { voiceMR.current?.stop(); [voiceTimerR,voiceBarR].forEach(r=>{if(r.current)clearInterval(r.current);}); setVoiceBars(Array(24).fill(8)); }
  function cancelVoice() { voiceMR.current?.stop(); [voiceTimerR,voiceBarR].forEach(r=>{if(r.current)clearInterval(r.current);}); setVoiceState('idle');setVoiceBlob(null);setVoiceSecs(0);setVoiceBars(Array(24).fill(4)); }
  function sendVoice() {
    if (!voiceBlob) return;
    const url=URL.createObjectURL(voiceBlob);
    onSend?.({id:'msg-'+Date.now(),text:'🎤 Voice ('+fmtSecs(voiceSecs)+')',formattedText:'🎤 Voice ('+fmtSecs(voiceSecs)+')',timestamp:new Date(),formats:[],attachmentType:'audio',attachmentName:'voice.webm',attachmentUrl:url});
    cancelVoice();
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  async function openCam() {
    try { const s=await navigator.mediaDevices.getUserMedia({video:true,audio:true}); videoStream.current=s; setVideoState('preview'); setVideoSecs(0); }
    catch { alert('Camera access denied.'); }
  }
  function startVideoRec() {
    if (!videoStream.current) return;
    const mr=new MediaRecorder(videoStream.current); videoChunks.current=[];
    mr.ondataavailable=e=>videoChunks.current.push(e.data);
    mr.onstop=()=>{ const b=new Blob(videoChunks.current,{type:'video/webm'}); setVideoBlob(b); setVideoState('done'); if(prevVidRef.current)prevVidRef.current.src=URL.createObjectURL(b); };
    mr.start(100); videoMR.current=mr; setVideoState('rec');
    videoTimerR.current=setInterval(()=>setVideoSecs(s=>s+1),1000);
  }
  function stopVideoRec()  { videoMR.current?.stop(); if(videoTimerR.current)clearInterval(videoTimerR.current); }
  function cancelVideo()   { videoMR.current?.stop(); if(videoTimerR.current)clearInterval(videoTimerR.current); videoStream.current?.getTracks().forEach(t=>t.stop()); setVideoState('idle');setVideoBlob(null);setVideoSecs(0); }
  function sendVideo() {
    if (!videoBlob) return;
    const url=URL.createObjectURL(videoBlob);
    onSend?.({id:'msg-'+Date.now(),text:'📹 Video ('+fmtSecs(videoSecs)+')',formattedText:'📹 Video ('+fmtSecs(videoSecs)+')',timestamp:new Date(),formats:[],attachmentType:'video',attachmentName:'clip.webm',attachmentUrl:url});
    cancelVideo();
  }

  function filteredPeople() {
    return people.filter(p=>p.name.toLowerCase().includes(mentionQ.toLowerCase())).slice(0,6);
  }

  const hasText = text.trim().length > 0;
  const fp = filteredPeople();
  const activeFmts = formats.size>0||isCode||isQuote||isBlock||!!isList||inlineFmts.length>0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="border-t border-[#2a2c33] bg-[#111214] shrink-0 select-none">

      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#18191d] border-b border-[#2a2c33]">
          <Reply size={12} className="text-[#a855f7] shrink-0"/>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-[#a855f7] mb-0.5 font-semibold">Replying to {replyTo.senderName}</p>
            <p className="font-mono text-[11px] text-[#6b7280] truncate">{replyTo.text}</p>
          </div>
          <button onClick={onClearReply} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors"><X size={12}/></button>
        </div>
      )}

      {/* Terminal panel */}
      {showTerminal && (
        <div className="mx-4 mt-3 rounded-xl overflow-hidden border border-[#2a2c33] bg-[#0c0e0e]"
          style={{animation:'rteIn 0.15s ease'}}>
          <div className="flex items-center justify-between px-3 py-2 bg-[#16181a] border-b border-[#1e2026]">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <button onClick={()=>setShowTerminal(false)} className="w-3 h-3 rounded-full bg-[#ef4444] hover:brightness-110"/>
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]"/>
                <div className="w-3 h-3 rounded-full bg-[#10b981]"/>
              </div>
              <span className="font-mono text-[10.5px] text-[#6b7280] ml-1">devtalk — bash</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={sendTermOutput} className="font-mono text-[10px] text-[#a855f7] hover:text-[#c084fc] px-2 py-0.5 rounded border border-[rgba(168,85,247,0.3)] hover:border-[rgba(168,85,247,0.5)] transition-colors">
                Send output
              </button>
              <button onClick={()=>setTermLines([{type:'system',text:'Cleared.'}])} className="font-mono text-[10px] text-[#6b7280] hover:text-[#e8eaf0] px-2 py-0.5 rounded border border-[#2a2c33] transition-colors">
                clear
              </button>
              <button onClick={()=>setShowTerminal(false)} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors"><X size={13}/></button>
            </div>
          </div>
          <div className="h-44 overflow-y-auto px-3 py-2.5 font-mono text-[12px] leading-[1.6] space-y-0.5">
            {termLines.map((l,i)=>(
              <div key={i} className={l.type==='input'?'text-[#c084fc]':l.type==='error'?'text-[#ef4444]':l.type==='system'?'text-[#33363f] italic text-[10px]':l.type==='info'?'text-[#6b7280]':'text-[#10b981]'}>
                {l.text}
              </div>
            ))}
            <div ref={termBotRef}/>
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#1a1c1e] bg-[#0e1010]">
            <span className="font-mono text-[11.5px] text-[#a855f7] shrink-0">$</span>
            <input ref={termInRef} autoFocus type="text" value={termInput} onChange={e=>setTermInput(e.target.value)} onKeyDown={termKey}
              placeholder="type a command..." spellCheck={false}
              className="flex-1 bg-transparent border-none outline-none font-mono text-[12px] text-[#e8eaf0] placeholder-[#2a2c33] caret-[#a855f7]"/>
            <button onClick={runTerm} className="text-[#6b7280] hover:text-[#a855f7] font-mono text-[11px] transition-colors">↵</button>
          </div>
        </div>
      )}

      {/* Voice panel */}
      {voiceState!=='idle' && (
        <div className="mx-4 mt-3 bg-[#18191d] border border-[#2a2c33] rounded-xl overflow-hidden" style={{animation:'rteIn 0.15s ease'}}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center gap-[2px] h-9 shrink-0">
              {voiceBars.map((h,i)=>(
                <div key={i} className="w-[3px] rounded-full transition-all duration-100"
                  style={{height:voiceState==='rec'?h+'px':'6px',background:voiceState==='rec'?'linear-gradient(to top,#7c3aed,#a855f7)':'#33363f'}}/>
              ))}
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold flex items-center gap-2">
                {voiceState==='rec'&&<span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse shrink-0"/>}
                {voiceState==='rec'?'Recording...':'Ready to send'}
              </p>
              <p className="font-mono text-[10.5px] text-[#6b7280]">{fmtSecs(voiceSecs)}</p>
            </div>
            {voiceState==='preview'&&voiceBlob&&(
              <audio controls src={URL.createObjectURL(voiceBlob)} className="h-8 w-36 shrink-0" style={{filter:'contrast(0.8) brightness(1.4)'}}/>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              {voiceState==='rec'
                ? <button onClick={stopVoice} className="w-9 h-9 rounded-full bg-[#ef4444] hover:bg-red-400 flex items-center justify-center text-white"><div className="w-3.5 h-3.5 bg-white rounded-sm"/></button>
                : <button onClick={sendVoice} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"><Send size={12}/> Send</button>
              }
              <button onClick={cancelVoice} className="w-8 h-8 bg-[#1e2026] border border-[#2a2c33] rounded-lg flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] transition-colors"><Trash2 size={13}/></button>
            </div>
          </div>
        </div>
      )}

      {/* Video panel */}
      {videoState!=='idle' && (
        <div className="mx-4 mt-3 bg-[#0c0e0e] border border-[#2a2c33] rounded-xl overflow-hidden" style={{animation:'rteIn 0.15s ease'}}>
          <div className="flex items-center justify-between px-3 py-2 bg-[#16181a] border-b border-[#1e2026]">
            <div className="flex items-center gap-2">
              {videoState==='rec'&&<div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"/>}
              <span className="font-mono text-[11px] text-[#9ca3af]">
                {videoState==='preview'?'Camera preview':videoState==='rec'?'Recording '+fmtSecs(videoSecs):'Video ready'}
              </span>
            </div>
            <button onClick={cancelVideo} className="text-[#6b7280] hover:text-[#e8eaf0] transition-colors"><X size={13}/></button>
          </div>
          <div className="relative bg-black" style={{height:'200px'}}>
            {(videoState==='preview'||videoState==='rec')&&<video ref={liveVidRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{transform:'scaleX(-1)'}}/>}
            {videoState==='done'&&<video ref={prevVidRef} controls playsInline className="w-full h-full object-cover"/>}
            {videoState==='rec'&&(
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"/>
                <span className="font-mono text-[10px] text-white">{fmtSecs(videoSecs)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#16181a]">
            {videoState==='preview'&&<button onClick={startVideoRec} className="flex items-center gap-2 bg-[#ef4444] hover:bg-red-400 text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all"><div className="w-3 h-3 rounded-full bg-white"/> Start</button>}
            {videoState==='rec'    &&<button onClick={stopVideoRec}  className="flex items-center gap-2 bg-[#ef4444] hover:bg-red-400 text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all"><div className="w-3.5 h-3.5 bg-white rounded-sm"/> Stop</button>}
            {videoState==='done'   &&<button onClick={sendVideo}     className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-5 py-2 rounded-xl transition-all"><Send size={13}/> Send Video</button>}
            <button onClick={cancelVideo} className="flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] text-[#9ca3af] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><X size={13}/> Cancel</button>
          </div>
        </div>
      )}

      {/* ── MAIN EDITOR BOX ── */}
      <div className="mx-4 my-3 bg-[#1e2026] border border-[#2a2c33] rounded-xl overflow-visible transition-colors duration-200"
        onFocusCapture={e=>(e.currentTarget as HTMLElement).style.borderColor='#7c3aed'}
        onBlurCapture={e =>(e.currentTarget as HTMLElement).style.borderColor='#2a2c33'}>

        {/* ── TOP TOOLBAR ── */}
        <div className="flex items-center gap-0.5 px-3 py-[7px] border-b border-[#2a2c33]">
          <TB active={formats.has('bold')}   onClick={()=>applyFormat('bold')}   title="Bold (Ctrl+B)">
            <span className="text-[13px] font-bold leading-none">B</span>
          </TB>
          <TB active={formats.has('italic')} onClick={()=>applyFormat('italic')} title="Italic (Ctrl+I)">
            <span className="text-[13px] italic font-serif leading-none">I</span>
          </TB>
          <TB active={formats.has('strike')} onClick={()=>toggleFmt('strike')} title="Strikethrough">
            <span className="text-[13px] line-through leading-none">S</span>
          </TB>

          <Sep/>

          <TB onClick={handleLink} title="Insert link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </TB>

          <TB active={isList==='bullet'}  onClick={()=>setIsList(p=>p==='bullet' ?null:'bullet')}  title="Bullet list">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
              <circle cx="4" cy="6"  r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          </TB>
          <TB active={isList==='ordered'} onClick={()=>setIsList(p=>p==='ordered'?null:'ordered')} title="Ordered list">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
              <path d="M4 6h1v4" strokeWidth="1.5"/><line x1="3" y1="10" x2="5" y2="10" strokeWidth="1.5"/>
              <path d="M3 14h2l-2 2h2" strokeWidth="1.5"/>
            </svg>
          </TB>

          <Sep/>

          <TB active={isQuote} onClick={()=>setIsQuote(p=>!p)} title="Block quote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
            </svg>
          </TB>
          <TB active={isCode} onClick={()=>setIsCode(p=>!p)} title="Inline code">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </TB>
          <TB active={isBlock} onClick={()=>setIsBlock(p=>!p)} title="Code block">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </TB>

          <Sep/>

          <TB active={showTerminal} onClick={()=>setShowTerminal(p=>!p)} title="Terminal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
          </TB>
        </div>

        {/* Active format badges */}
        {activeFmts && (
          <div className="flex items-center gap-1 px-3 pt-1.5 flex-wrap">
            {formats.has('bold')  &&<FB onClick={()=>toggleFmt('bold')}>bold ×</FB>}
            {formats.has('italic')&&<FB onClick={()=>toggleFmt('italic')}>italic ×</FB>}
            {formats.has('strike')&&<FB onClick={()=>toggleFmt('strike')}>strike ×</FB>}
            {isCode  &&<FB onClick={()=>setIsCode(false)}>code ×</FB>}
            {isQuote &&<FB onClick={()=>setIsQuote(false)}>quote ×</FB>}
            {isBlock &&<FB onClick={()=>setIsBlock(false)}>block ×</FB>}
            {isList  &&<FB onClick={()=>setIsList(null)}>{isList} list ×</FB>}
            {inlineFmts.map((r,i)=>(
              <FB key={i} onClick={()=>setInlineFmts(p=>p.filter((_,j)=>j!==i))}>
                {r.f==='bold'?<strong>{r.t}</strong>:r.f==='italic'?<em>{r.t}</em>:<s>{r.t}</s>} ×
              </FB>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea ref={taRef} value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck autoComplete="off"
            className={[
              'w-full bg-transparent border-none outline-none text-[#e8eaf0] text-[13px]',
              'placeholder-[#6b7280] resize-none leading-relaxed px-3 py-3 select-text',
              formats.has('bold')   ? 'font-bold'   : 'font-normal',
              formats.has('italic') ? 'italic'       : '',
              isCode||isBlock       ? 'font-mono text-[12px]' : '',
            ].filter(Boolean).join(' ')}
            style={{minHeight:'52px',maxHeight:'160px'}}
          />

          {/* @mention dropdown */}
          {showMention && fp.length>0 && (
            <div className="absolute bottom-full left-3 mb-2 bg-[#1a1b1f] border border-[#33363f] rounded-xl overflow-hidden shadow-2xl z-30 w-60"
              style={{animation:'rteIn 0.12s ease'}}>
              <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 border-b border-[#2a2c33]">
                <AtSign size={10} className="text-[#a855f7]"/>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280]">Mention</p>
              </div>
              {fp.map((p,i)=>(
                <button key={p.id} onClick={()=>insertMention(p.name)}
                  className={['w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left', i===mentionIdx?'bg-[rgba(124,58,237,0.15)]':'hover:bg-[#252629]'].join(' ')}>
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:p.color}}>{p.avatar}</div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#1a1b1f]" style={{background:SC[p.status]}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold truncate">{p.name}</p>
                    <p className="font-mono text-[9.5px] text-[#6b7280] truncate">{p.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM TOOLBAR */}
        <div className="flex items-center gap-1 px-3 py-[7px] border-t border-[#2a2c33]">

          {/* + Attach */}
          <div className="relative" ref={attachRef}>
            <TB active={showAttach} onClick={()=>setShowAttach(p=>!p)} title="Attach">
              <Plus size={15}/>
            </TB>
            {showAttach && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#1a1b1f] border border-[#33363f] rounded-xl overflow-hidden shadow-2xl z-30 w-44" style={{animation:'rteIn 0.12s ease'}}>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] px-3 pt-2 pb-1">Attach</p>
                <button onClick={()=>fileRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#252629] transition-colors text-left">
                  <Paperclip size={13} className="text-[#6b7280]"/><span className="text-[13px]">File</span>
                </button>
                <button onClick={()=>imgRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#252629] transition-colors text-left">
                  <Image size={13} className="text-[#6b7280]"/><span className="text-[13px]">Image</span>
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0],'file');}}/>
                <input ref={imgRef}  type="file" accept="image/*" className="hidden" onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0],'image');}}/>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-[#2a2c33] mx-0.5"/>

          {/* Emoji */}
          <div className="relative" ref={emojiRef}>
            <TB active={showEmoji} onClick={()=>setShowEmoji(p=>!p)} title="Emoji">
              <Smile size={15}/>
            </TB>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#1a1b1f] border border-[#33363f] rounded-xl p-3 shadow-2xl z-30 w-[280px]" style={{animation:'rteIn 0.12s ease'}}>
                <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>insertEmoji(e)}
                      className="w-8 h-8 flex items-center justify-center text-[17px] hover:bg-[#252629] rounded-lg transition-colors">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* @ Mention */}
          <TB onClick={()=>{setText(p=>p+'@');taRef.current?.focus();}} title="Mention">
            <AtSign size={15}/>
          </TB>

          {/* Video */}
          <TB active={videoState!=='idle'}
            onClick={()=>videoState==='idle'?openCam():cancelVideo()}
            title="Video clip">
            <Video size={15} className={videoState==='rec'?'text-[#ef4444]':''}/>
          </TB>

          {/* Mic */}
          <TB active={voiceState!=='idle'}
            onClick={()=>voiceState==='idle'?startVoice():voiceState==='rec'?stopVoice():undefined}
            title={voiceState==='idle'?'Voice message':voiceState==='rec'?'Stop recording':'Preview'}>
            <Mic size={15} className={voiceState==='rec'?'text-[#ef4444]':''}/>
          </TB>

          <div className="flex-1"/>

          {/* Send + chevron */}
          <div className="flex items-center gap-0">
            <button onClick={doSend} disabled={!hasText||sendState==='sending'}
              className={[
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-l-lg text-[12.5px] font-semibold transition-all',
                hasText&&sendState!=='sending'
                  ? 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'
                  : 'bg-transparent text-[#33363f] cursor-not-allowed',
              ].join(' ')}>
              {sendState==='sending'
                ? <RefreshCw size={13} className="animate-spin"/>
                : sendState==='sent'
                  ? <Check size={13}/>
                  : <Send size={13}/>
              }
              {sendState==='sending'?'Sending':sendState==='sent'?'Sent!':'Send'}
            </button>
            <button
              className={[
                'flex items-center justify-center w-8 py-1.5 rounded-r-lg border-l transition-all',
                hasText
                  ? 'bg-[#7c3aed] hover:bg-[#a855f7] text-white border-[#6d28d9]'
                  : 'bg-transparent text-[#33363f] border-[#2a2c33] cursor-not-allowed',
              ].join(' ')}
              title="Send options">
              <ChevronDown size={12}/>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rteIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0);   }
        }
      `}</style>
    </div>
  );
}

// ── Micro components ───────────────────────────────────────────────────────────
function TB({ children, onClick, active, title }: {
  children:React.ReactNode; onClick:()=>void; active?:boolean; title?:string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={[
        'w-7 h-7 flex items-center justify-center rounded-md transition-all',
        active
          ? 'bg-[rgba(124,58,237,0.22)] text-[#c084fc]'
          : 'text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#2a2c33]',
      ].join(' ')}>
      {children}
    </button>
  );
}

function Sep() { return <div className="w-px h-4 bg-[#2a2c33] mx-0.5 shrink-0"/>; }

function FB({ children, onClick }: { children:React.ReactNode; onClick:()=>void }) {
  return (
    <button onClick={onClick}
      className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[rgba(124,58,237,0.18)] text-[#c084fc] border border-[rgba(124,58,237,0.3)] hover:bg-[rgba(239,68,68,0.12)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)] transition-colors cursor-pointer">
      {children}
    </button>
  );
}

export default RichTextEditor;
