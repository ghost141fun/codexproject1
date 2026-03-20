'use client';

import { useState } from 'react';
import {
  LayoutGrid,
  CheckCircle2,
  MessageSquare,
  Database,
  BarChart2,
  Users,
  Code2,
  Search,
  Plus,
  X,
  Check,
  Zap,
  RefreshCw,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'all' | 'connected' | 'communication' | 'storage' | 'analytics' | 'crm' | 'devtools';

interface Field {
  label: string;
  placeholder: string;
}

interface Integration {
  id: number;
  name: string;
  emoji: string;
  bg: string;
  category: Exclude<Category, 'all' | 'connected'>;
  connected: boolean;
  desc: string;
  tags: string[];
  fields: Field[];
  glow: string;
}

// ── Data ───────────────────────────────────────────────────────────────────────
const INITIAL_INTEGRATIONS: Integration[] = [
  { id: 1,  name: 'Slack',        emoji: '💬', bg: '#4A154B', category: 'communication', connected: true,  desc: 'Send alerts and notifications to Slack channels in real-time.',        tags: ['messaging','alerts'],          fields: [{ label: 'Webhook URL',         placeholder: 'https://hooks.slack.com/...' }],                                                                                    glow: 'rgba(74,21,75,0.35)'   },
  { id: 2,  name: 'GitHub',       emoji: '🐙', bg: '#161b22', category: 'devtools',      connected: true,  desc: 'Sync repos, trigger workflows, and track pull requests.',             tags: ['git','ci/cd'],                 fields: [{ label: 'Personal Access Token', placeholder: 'ghp_...' }, { label: 'Organization', placeholder: 'your-org' }],                                          glow: 'rgba(36,41,47,0.35)'   },
  { id: 3,  name: 'Google Drive', emoji: '📁', bg: '#1a73e8', category: 'storage',       connected: true,  desc: 'Read and write files directly from your Drive.',                     tags: ['files','sync'],                fields: [{ label: 'OAuth Client ID',       placeholder: 'xxxx.apps.googleusercontent.com' }],                                                                               glow: 'rgba(26,115,232,0.35)' },
  { id: 4,  name: 'Amplitude',    emoji: '📊', bg: '#1f1135', category: 'analytics',     connected: true,  desc: 'Track product analytics and funnel conversions.',                    tags: ['analytics','events'],          fields: [{ label: 'API Key',               placeholder: 'your-api-key' }, { label: 'Secret Key', placeholder: 'your-secret-key' }],                               glow: 'rgba(31,17,53,0.35)'   },
  { id: 5,  name: 'Notion',       emoji: '📝', bg: '#2f2f2f', category: 'storage',       connected: false, desc: 'Create and sync pages, databases, and documents.',                  tags: ['docs','wiki'],                 fields: [{ label: 'Integration Token',     placeholder: 'secret_...' }],                                                                                                    glow: 'rgba(47,47,47,0.35)'   },
  { id: 6,  name: 'Salesforce',   emoji: '☁️', bg: '#00a1e0', category: 'crm',           connected: false, desc: 'Sync leads, contacts, and opportunities from your CRM.',            tags: ['crm','leads'],                 fields: [{ label: 'Client ID', placeholder: '' }, { label: 'Client Secret', placeholder: '' }, { label: 'Instance URL', placeholder: 'https://your-domain.salesforce.com' }], glow: 'rgba(0,161,224,0.25)'  },
  { id: 7,  name: 'Stripe',       emoji: '💳', bg: '#6772e5', category: 'analytics',     connected: false, desc: 'Monitor payments, subscriptions, and revenue metrics.',             tags: ['payments','billing'],          fields: [{ label: 'Secret Key',            placeholder: 'sk_live_...' }, { label: 'Webhook Secret', placeholder: 'whsec_...' }],                                       glow: 'rgba(103,114,229,0.25)'},
  { id: 8,  name: 'Jira',         emoji: '🔵', bg: '#0052cc', category: 'devtools',      connected: false, desc: 'Track issues, sprints, and project milestones.',                    tags: ['tickets','agile'],             fields: [{ label: 'Domain',                placeholder: 'your-org.atlassian.net' }, { label: 'API Token', placeholder: '' }],                                         glow: 'rgba(0,82,204,0.25)'   },
  { id: 9,  name: 'HubSpot',      emoji: '🧲', bg: '#ff5c35', category: 'crm',           connected: false, desc: 'Manage contacts, deals, and marketing pipelines.',                  tags: ['crm','marketing'],             fields: [{ label: 'Access Token',          placeholder: 'pat-na1-...' }],                                                                                                   glow: 'rgba(255,92,53,0.25)'  },
  { id: 10, name: 'Datadog',      emoji: '🐶', bg: '#632ca6', category: 'analytics',     connected: false, desc: 'Monitor infrastructure, logs, and APM traces.',                     tags: ['monitoring','logs'],           fields: [{ label: 'API Key',               placeholder: '' }, { label: 'App Key', placeholder: '' }],                                                                    glow: 'rgba(99,44,166,0.25)'  },
  { id: 11, name: 'Twilio',       emoji: '📱', bg: '#f22f46', category: 'communication', connected: false, desc: 'Send SMS, calls, and WhatsApp messages programmatically.',           tags: ['sms','calls'],                 fields: [{ label: 'Account SID',           placeholder: 'ACxxxxxxxxxxxxxxxx' }, { label: 'Auth Token', placeholder: '' }],                                                  glow: 'rgba(242,47,70,0.25)'  },
  { id: 12, name: 'AWS S3',       emoji: '🪣', bg: '#232f3e', category: 'storage',       connected: false, desc: 'Store and retrieve objects from S3 buckets.',                       tags: ['cloud','files'],               fields: [{ label: 'Access Key ID',         placeholder: 'AKIAXXXXXXXXXXXXXXXX' }, { label: 'Secret Access Key', placeholder: '' }, { label: 'Bucket', placeholder: 'my-bucket' }], glow: 'rgba(35,47,62,0.35)'   },
];

// ── Sidebar nav config ─────────────────────────────────────────────────────────
const NAV_BROWSE = [
  { key: 'all' as Category,       label: 'All',           Icon: LayoutGrid   },
  { key: 'connected' as Category, label: 'Connected',     Icon: CheckCircle2 },
];
const NAV_CATEGORIES = [
  { key: 'communication' as Category, label: 'Communication', Icon: MessageSquare },
  { key: 'storage' as Category,       label: 'Storage',        Icon: Database      },
  { key: 'analytics' as Category,     label: 'Analytics',      Icon: BarChart2     },
  { key: 'crm' as Category,           label: 'CRM',             Icon: Users         },
  { key: 'devtools' as Category,      label: 'Dev Tools',       Icon: Code2         },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [activeFilter, setActiveFilter] = useState<Category>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [modalId, setModalId]           = useState<number | null>(null);
  const [fieldValues, setFieldValues]   = useState<Record<string, string>>({});
  const [toast, setToast]               = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });

  // ── Derived data ──
  const connectedCount = integrations.filter(i => i.connected).length;
  const availableCount = integrations.length - connectedCount;

  const filtered = integrations.filter(i => {
    const matchSearch = !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'all')       return true;
    if (activeFilter === 'connected') return i.connected;
    return i.category === activeFilter;
  });

  const connectedList = filtered.filter(i => i.connected);
  const availableList = filtered.filter(i => !i.connected);

  const modalItem = integrations.find(i => i.id === modalId) ?? null;

  // ── Handlers ──
  function showToast(msg: string) {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  }

  function handleConnectBtn(id: number) {
    const item = integrations.find(i => i.id === id)!;
    if (item.connected) {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i));
      showToast(`${item.name} disconnected`);
    } else {
      setFieldValues({});
      setModalId(id);
    }
  }

  function confirmConnect() {
    if (!modalItem) return;
    setIntegrations(prev => prev.map(i => i.id === modalItem.id ? { ...i, connected: true } : i));
    showToast(`${modalItem.name} connected successfully!`);
    setModalId(null);
  }

  // ── Render ──
  return (
    <div className="flex flex-col h-screen bg-[#111214] text-[#e8eaf0] font-sans overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-7 py-[18px] border-b border-[#2a2c33] bg-[#111214] shrink-0">
        <div className="flex items-center gap-2.5">
          <LayoutGrid size={20} className="text-[#a855f7]" />
          <h1 className="text-[17px] font-bold tracking-tight">Integrations</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[#18191d] border border-[#2a2c33] rounded-lg px-3.5 py-[7px] w-[220px] focus-within:border-[#7c3aed] transition-colors">
            <Search size={13} className="text-[#6b7280] shrink-0" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e8eaf0] text-[12.5px] w-full placeholder-[#6b7280] font-mono"
            />
          </div>
          {/* Add Custom */}
          <button className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-all hover:-translate-y-px">
            <Plus size={14} strokeWidth={2.5} />
            Add Custom
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-[220px] border-r border-[#2a2c33] flex flex-col gap-1 px-3 py-5 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-2.5 pb-1 pt-2">Browse</p>
          {NAV_BROWSE.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-all text-left w-full
                ${activeFilter === key
                  ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]'
                  : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'}`}
            >
              <Icon size={15} />
              {label}
              <span className="ml-auto bg-[#1e2026] border border-[#33363f] rounded-full font-mono text-[10px] px-1.5 py-px text-[#6b7280]">
                {key === 'all' ? integrations.length : connectedCount}
              </span>
            </button>
          ))}

          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-2.5 pb-1 pt-4">Category</p>
          {NAV_CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] font-medium transition-all text-left w-full
                ${activeFilter === key
                  ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]'
                  : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto px-8 py-7 scrollbar-thin scrollbar-thumb-[#33363f] scrollbar-track-transparent">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total',     val: integrations.length, color: '#e8eaf0'  },
              { label: 'Connected', val: connectedCount,       color: '#10b981'  },
              { label: 'Available', val: availableCount,       color: '#c084fc'  },
              { label: 'Syncing',   val: 2,                    color: '#3b82f6'  },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#18191d] border border-[#2a2c33] rounded-xl px-[18px] py-4">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.07em] text-[#6b7280] mb-1.5">{label}</p>
                <p className="text-[24px] font-extrabold leading-none tracking-tight" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Connected section */}
          {connectedList.length > 0 && (
            <section className="mb-9">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[14px] font-semibold text-[#6b7280] uppercase tracking-[0.05em]">Connected</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">Active</span>
              </div>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {connectedList.map(item => (
                  <IntegrationCard key={item.id} item={item} onAction={handleConnectBtn} />
                ))}
              </div>
            </section>
          )}

          {/* Available section */}
          {availableList.length > 0 && activeFilter !== 'connected' && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[14px] font-semibold text-[#6b7280] uppercase tracking-[0.05em]">Available</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(124,58,237,0.12)] text-[#c084fc] border border-[rgba(124,58,237,0.25)]">Browse</span>
              </div>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {availableList.map(item => (
                  <IntegrationCard key={item.id} item={item} onAction={handleConnectBtn} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#6b7280]">
              <Zap size={32} className="opacity-30" />
              <p className="font-mono text-sm">No integrations found</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Connect Modal ── */}
      {modalItem && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setModalId(null); }}
        >
          <div className="bg-[#18191d] border border-[#33363f] rounded-2xl p-7 w-[460px] max-w-[95vw] animate-[slideUp_0.2s_ease]">
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-[21px] shrink-0"
                style={{ background: modalItem.bg }}>
                {modalItem.emoji}
              </div>
              <div>
                <p className="text-[18px] font-bold">Connect {modalItem.name}</p>
                <p className="font-mono text-[12px] text-[#6b7280] mt-0.5">{modalItem.desc}</p>
              </div>
              <button
                onClick={() => setModalId(null)}
                className="ml-auto w-[30px] h-[30px] bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] hover:bg-[#2a2c33] flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Fields */}
            {modalItem.fields.map(f => (
              <div key={f.label} className="mb-3.5">
                <label className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">
                  {f.label}
                </label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={fieldValues[f.label] ?? ''}
                  onChange={e => setFieldValues(prev => ({ ...prev, [f.label]: e.target.value }))}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-3 py-2.5 text-[#e8eaf0] font-mono text-[13px] outline-none transition-colors placeholder-[#6b7280]"
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-2.5 justify-end mt-5">
              <button
                onClick={() => setModalId(null)}
                className="bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#33363f] rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConnect}
                className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-all hover:-translate-y-px"
              >
                <Check size={14} strokeWidth={2.5} />
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ── */}
      <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 bg-[#18191d] border border-[#10b981] rounded-xl px-[18px] py-3 text-[#10b981] font-semibold text-[13.5px] shadow-2xl z-[200] transition-all duration-[350ms]
        ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <Check size={16} strokeWidth={2.5} />
        {toast.msg}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Integration Card ───────────────────────────────────────────────────────────
function IntegrationCard({ item, onAction }: { item: Integration; onAction: (id: number) => void }) {
  return (
    <div
      className="group relative bg-[#18191d] border border-[#2a2c33] rounded-xl p-5 cursor-pointer overflow-hidden
        hover:border-[#33363f] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-200"
    >
      {/* Glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{ background: `radial-gradient(circle at top right, ${item.glow} 0%, transparent 60%)` }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[21px] shrink-0"
          style={{ background: item.bg }}>
          {item.emoji}
        </div>
        <div className={`flex items-center gap-1.5 font-mono text-[11px] font-medium
          ${item.connected ? 'text-[#10b981]' : 'text-[#6b7280]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' : 'bg-[#33363f]'}`} />
          {item.connected ? 'Connected' : 'Not connected'}
        </div>
      </div>

      <p className="text-[15px] font-bold tracking-tight mb-1">{item.name}</p>
      <p className="font-mono text-[12.5px] font-light text-[#6b7280] leading-[1.55] mb-4">{item.desc}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {item.tags.map(t => (
            <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded-[5px] bg-[#1e2026] text-[#6b7280] border border-[#2a2c33]">
              {t}
            </span>
          ))}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAction(item.id); }}
          className={`shrink-0 font-semibold text-[12px] px-3.5 py-1.5 rounded-lg border transition-all
            ${item.connected
              ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.25)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.25)]'
              : 'bg-[#7c3aed] text-white border-transparent hover:bg-[#a855f7] hover:-translate-y-px'}`}
        >
          {item.connected ? 'Connected ✓' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
