'use client';

import { useState } from 'react';
import {
  LayoutGrid, CheckCircle2, MessageSquare, Database, BarChart2,
  Users, Code2, Search, Plus, X, Check, Zap, ChevronRight, Star,
  Sparkles, Bell, RefreshCw, Link2, Shield, ToggleLeft, ToggleRight,
  Calendar, Clock, Download, Upload, Settings2, ExternalLink, FileSpreadsheet,
  Palette, Video, CheckSquare, BookOpen, PenLine,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'all' | 'connected' | 'communication' | 'storage' | 'analytics' | 'crm' | 'devtools' | 'productivity';

interface Field { label: string; placeholder: string; }

interface Integration {
  id: number; name: string; emoji: string; bg: string;
  category: Exclude<Category, 'all' | 'connected'>;
  connected: boolean; desc: string; tags: string[];
  fields: Field[]; glow: string; custom?: boolean;
}

interface CustomTemplate {
  name: string; emoji: string; bg: string;
  category: Exclude<Category, 'all' | 'connected'>;
  desc: string; tags: string[]; fields: Field[]; glow: string;
  featured?: boolean; badge?: string;
}

interface ProdFeature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  settingKey: string;
  type: 'toggle' | 'select';
  options?: string[];
  default: boolean | string;
}

// ── Productivity feature definitions ──────────────────────────────────────────
const PROD_FEATURES: Record<string, ProdFeature[]> = {
  'Microsoft Excel': [
    { icon: <Upload size={14}/>,          title: 'Auto-push reports',       desc: 'Automatically push Codex Teams summaries to your workbook daily.',        settingKey:'autoPush',      type:'toggle', default:false },
    { icon: <Download size={14}/>,        title: 'Import on connect',       desc: 'Pull latest rows from your sheet when a channel is opened.',           settingKey:'importOnLoad',  type:'toggle', default:true  },
    { icon: <RefreshCw size={14}/>,       title: 'Sync interval',           desc: 'How often to sync data between Codex Teams and Excel.',                    settingKey:'syncInterval',  type:'select', options:['5 min','15 min','30 min','1 hour'], default:'15 min' },
    { icon: <Bell size={14}/>,            title: 'Change notifications',    desc: 'Notify the channel when the workbook is edited by a collaborator.',    settingKey:'changeNotifs',  type:'toggle', default:true  },
    { icon: <Shield size={14}/>,          title: 'Read-only mode',          desc: 'Prevent Codex Teams from writing back to the workbook.',                   settingKey:'readOnly',      type:'toggle', default:false },
    { icon: <FileSpreadsheet size={14}/>, title: 'Embed sheet previews',    desc: 'Show a live table preview when a workbook is linked in a message.',    settingKey:'embedPreview',  type:'toggle', default:true  },
  ],
  'Figma': [
    { icon: <ExternalLink size={14}/>,    title: 'Inline file preview',     desc: 'Render a Figma frame thumbnail when a file URL is pasted.',            settingKey:'inlinePreview', type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'Comment notifications',   desc: 'Post a message when someone adds a comment on a linked file.',         settingKey:'commentNotifs', type:'toggle', default:true  },
    { icon: <RefreshCw size={14}/>,       title: 'Version alerts',          desc: 'Notify the channel when a new Figma version is published.',            settingKey:'versionAlerts', type:'toggle', default:false },
    { icon: <Link2 size={14}/>,           title: 'Auto-link detection',     desc: 'Automatically detect and expand Figma URLs in any channel.',           settingKey:'autoLink',      type:'toggle', default:true  },
    { icon: <Palette size={14}/>,         title: 'Default frame size',      desc: 'Choose the thumbnail size shown in previews.',                         settingKey:'frameSize',     type:'select', options:['Small','Medium','Large'], default:'Medium' },
  ],
  'Loom': [
    { icon: <Video size={14}/>,           title: 'Inline video player',     desc: 'Embed a playable Loom video directly inside messages.',                settingKey:'inlinePlayer',  type:'toggle', default:true  },
    { icon: <BookOpen size={14}/>,        title: 'Auto-transcript',         desc: 'Attach an AI-generated transcript below each shared recording.',       settingKey:'autoTranscript',type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'View notifications',      desc: 'Notify you when someone watches your shared Loom.',                    settingKey:'viewNotifs',    type:'toggle', default:false },
    { icon: <Clock size={14}/>,           title: 'Chapter summaries',       desc: 'Show AI chapter timestamps below the video for quick navigation.',     settingKey:'chapters',      type:'toggle', default:true  },
    { icon: <Download size={14}/>,        title: 'Download transcript',     desc: 'Allow members to download the transcript as a .txt file.',             settingKey:'downloadTxt',   type:'toggle', default:false },
  ],
  'Google Calendar': [
    { icon: <Calendar size={14}/>,        title: 'Meeting reminders',       desc: 'Post a message 10 minutes before a calendar event starts.',            settingKey:'meetingReminders',type:'toggle', default:true  },
    { icon: <Plus size={14}/>,            title: 'Create from messages',    desc: 'Turn any Codex Teams message into a calendar event with /event.',          settingKey:'createFromMsg', type:'toggle', default:true  },
    { icon: <RefreshCw size={14}/>,       title: 'Sync frequency',          desc: 'How often to refresh your calendar feed.',                             settingKey:'syncFreq',      type:'select', options:['1 min','5 min','15 min'], default:'5 min' },
    { icon: <Bell size={14}/>,            title: 'Daily agenda digest',     desc: 'Post your day\'s meetings to a private DM every morning.',             settingKey:'dailyDigest',   type:'toggle', default:false },
    { icon: <Link2 size={14}/>,           title: 'Auto-join links',         desc: 'Detect Google Meet / Zoom links and surface a join button.',           settingKey:'autoJoin',      type:'toggle', default:true  },
  ],
  'Asana': [
    { icon: <CheckSquare size={14}/>,     title: 'Task creation shortcuts', desc: 'Use /task in any channel to create an Asana task instantly.',          settingKey:'taskShortcut',  type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'Task update alerts',      desc: 'Notify the channel when an Asana task is completed or reassigned.',    settingKey:'taskAlerts',    type:'toggle', default:true  },
    { icon: <Link2 size={14}/>,           title: 'URL unfurl',              desc: 'Expand Asana task URLs into rich previews with status and assignee.',  settingKey:'urlUnfurl',     type:'toggle', default:true  },
    { icon: <RefreshCw size={14}/>,       title: 'Project sync',            desc: 'Mirror a Codex Teams channel to an Asana project.',                       settingKey:'projectSync',   type:'toggle', default:false },
    { icon: <Calendar size={14}/>,        title: 'Due date reminders',      desc: 'DM assignees 24 hours before a task is due.',                         settingKey:'dueDateDm',     type:'toggle', default:true  },
  ],
  'Grammarly': [
    { icon: <PenLine size={14}/>,         title: 'Inline suggestions',      desc: 'Show grammar and spelling fixes as you type in any channel.',          settingKey:'inlineSuggest', type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'Tone detector',           desc: 'Warn you if a message sounds too aggressive or unclear.',              settingKey:'toneDetector',  type:'toggle', default:true  },
    { icon: <Shield size={14}/>,          title: 'Clarity score',           desc: 'Display a readability score before you send long messages.',           settingKey:'clarityScore',  type:'toggle', default:false },
    { icon: <RefreshCw size={14}/>,       title: 'Auto-correct',            desc: 'Automatically fix common typos without a confirmation prompt.',        settingKey:'autoCorrect',   type:'toggle', default:false },
    { icon: <BookOpen size={14}/>,        title: 'Vocabulary suggestions',  desc: 'Suggest stronger or more precise word choices.',                       settingKey:'vocabSuggest',  type:'toggle', default:true  },
  ],
  'Microsoft To Do': [
    { icon: <Plus size={14}/>,            title: 'Message to task',         desc: 'Right-click any message to instantly create a To Do task.',            settingKey:'msgToTask',     type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'Due reminders',           desc: 'Send a DM when a task assigned to you is due.',                        settingKey:'dueReminder',   type:'toggle', default:true  },
    { icon: <RefreshCw size={14}/>,       title: 'Sync interval',           desc: 'How often to sync your To Do lists with Codex Teams.',                     settingKey:'syncInterval',  type:'select', options:['Real-time','5 min','30 min'], default:'Real-time' },
    { icon: <CheckSquare size={14}/>,     title: 'Completion notifications',desc: 'Notify the channel when a shared task is completed.',                  settingKey:'completeNotif', type:'toggle', default:false },
    { icon: <Link2 size={14}/>,           title: 'Shared list access',      desc: 'Allow channel members to view and edit linked To Do lists.',           settingKey:'sharedAccess',  type:'toggle', default:true  },
  ],
  'Miro': [
    { icon: <ExternalLink size={14}/>,    title: 'Board embed',             desc: 'Show a live Miro board preview when a board URL is shared.',           settingKey:'boardEmbed',    type:'toggle', default:true  },
    { icon: <Bell size={14}/>,            title: 'Edit notifications',      desc: 'Post a message when a collaborator edits a linked board.',             settingKey:'editNotifs',    type:'toggle', default:false },
    { icon: <Plus size={14}/>,            title: 'Create board shortcut',   desc: 'Use /miro in any channel to create a new board instantly.',            settingKey:'createShortcut',type:'toggle', default:true  },
    { icon: <Palette size={14}/>,         title: 'Embed resolution',        desc: 'Quality of the embedded board thumbnail.',                             settingKey:'embedRes',      type:'select', options:['Low','Medium','High'], default:'Medium' },
    { icon: <Shield size={14}/>,          title: 'View-only embeds',        desc: 'Prevent editing directly from the Codex Teams embed.',                     settingKey:'viewOnlyEmbed', type:'toggle', default:true  },
  ],
};

// ── Default features for any productivity card without a specific config ──────
const DEFAULT_PROD_FEATURES: ProdFeature[] = [
  { icon: <Bell size={14}/>,     title: 'Notifications',    desc: 'Receive alerts for important events from this integration.',  settingKey:'notifications', type:'toggle', default:true  },
  { icon: <RefreshCw size={14}/>,title: 'Auto-sync',        desc: 'Keep data in sync automatically at a regular interval.',      settingKey:'autoSync',      type:'toggle', default:false },
  { icon: <Link2 size={14}/>,    title: 'URL unfurling',    desc: 'Expand links from this service into rich previews.',          settingKey:'urlUnfurl',     type:'toggle', default:true  },
  { icon: <Shield size={14}/>,   title: 'Read-only mode',   desc: 'Prevent Codex Teams from writing data back to this service.',     settingKey:'readOnly',      type:'toggle', default:false },
];

// ── Built-in integrations ──────────────────────────────────────────────────────
const INITIAL_INTEGRATIONS: Integration[] = [
  { id:1,  name:'Slack',            emoji:'\u{1F4AC}', bg:'#4A154B', category:'communication', connected:false, desc:'Send alerts and notifications to Slack channels in real-time.',                                                                    tags:['messaging','alerts'],            fields:[{label:'Webhook URL',placeholder:'https://hooks.slack.com/...'}],                                                                                                                                          glow:'rgba(74,21,75,0.35)'     },
  { id:2,  name:'GitHub',           emoji:'\u{1F419}', bg:'#161b22', category:'devtools',      connected:false, desc:'Sync repos, trigger workflows, and track pull requests.',                                                                          tags:['git','ci/cd'],                   fields:[{label:'Personal Access Token',placeholder:'ghp_...'},{label:'Organization',placeholder:'your-org'}],                                                                                                        glow:'rgba(36,41,47,0.35)'     },
  { id:3,  name:'Google Drive',     emoji:'\u{1F4C1}', bg:'#1a73e8', category:'storage',       connected:false, desc:'Read and write files directly from your Drive.',                                                                                   tags:['files','sync'],                  fields:[{label:'OAuth Client ID',placeholder:'xxxx.apps.googleusercontent.com'}],                                                                                                                                  glow:'rgba(26,115,232,0.35)'   },
  { id:4,  name:'Amplitude',        emoji:'\u{1F4CA}', bg:'#1f1135', category:'analytics',     connected:false, desc:'Track product analytics and funnel conversions.',                                                                                  tags:['analytics','events'],            fields:[{label:'API Key',placeholder:'your-api-key'},{label:'Secret Key',placeholder:'your-secret-key'}],                                                                                                            glow:'rgba(31,17,53,0.35)'     },
  { id:5,  name:'Notion',           emoji:'\u{1F4DD}', bg:'#2f2f2f', category:'storage',       connected:false, desc:'Create and sync pages, databases, and documents.',                                                                                 tags:['docs','wiki'],                   fields:[{label:'Integration Token',placeholder:'secret_...'}],                                                                                                                                                    glow:'rgba(47,47,47,0.35)'     },
  { id:6,  name:'Salesforce',       emoji:'\u2601\uFE0F',bg:'#00a1e0',category:'crm',          connected:false, desc:'Sync leads, contacts, and opportunities from your CRM.',                                                                           tags:['crm','leads'],                   fields:[{label:'Client ID',placeholder:''},{label:'Client Secret',placeholder:''},{label:'Instance URL',placeholder:'https://your-domain.salesforce.com'}],                                                           glow:'rgba(0,161,224,0.25)'    },
  { id:7,  name:'Stripe',           emoji:'\u{1F4B3}', bg:'#6772e5', category:'analytics',     connected:false, desc:'Monitor payments, subscriptions, and revenue metrics.',                                                                            tags:['payments','billing'],            fields:[{label:'Secret Key',placeholder:'sk_live_...'},{label:'Webhook Secret',placeholder:'whsec_...'}],                                                                                                            glow:'rgba(103,114,229,0.25)'  },
  { id:8,  name:'Jira',             emoji:'\u{1F535}', bg:'#0052cc', category:'devtools',      connected:false, desc:'Track issues, sprints, and project milestones.',                                                                                   tags:['tickets','agile'],               fields:[{label:'Domain',placeholder:'your-org.atlassian.net'},{label:'API Token',placeholder:''}],                                                                                                                    glow:'rgba(0,82,204,0.25)'     },
  { id:9,  name:'HubSpot',          emoji:'\u{1F9F2}', bg:'#ff5c35', category:'crm',           connected:false, desc:'Manage contacts, deals, and marketing pipelines.',                                                                                 tags:['crm','marketing'],               fields:[{label:'Access Token',placeholder:'pat-na1-...'}],                                                                                                                                                        glow:'rgba(255,92,53,0.25)'    },
  { id:10, name:'Datadog',          emoji:'\u{1F436}', bg:'#632ca6', category:'analytics',     connected:false, desc:'Monitor infrastructure, logs, and APM traces.',                                                                                    tags:['monitoring','logs'],             fields:[{label:'API Key',placeholder:''},{label:'App Key',placeholder:''}],                                                                                                                                        glow:'rgba(99,44,166,0.25)'    },
  { id:11, name:'Twilio',           emoji:'\u{1F4F1}', bg:'#f22f46', category:'communication', connected:false, desc:'Send SMS, calls, and WhatsApp messages programmatically.',                                                                         tags:['sms','calls'],                   fields:[{label:'Account SID',placeholder:'ACxxxxxxxxxxxxxxxx'},{label:'Auth Token',placeholder:''}],                                                                                                                  glow:'rgba(242,47,70,0.25)'    },
  { id:12, name:'AWS S3',           emoji:'\u{1FAA3}', bg:'#232f3e', category:'storage',       connected:false, desc:'Store and retrieve objects from S3 buckets.',                                                                                      tags:['cloud','files'],                 fields:[{label:'Access Key ID',placeholder:'AKIAXXXXXXXXXXXXXXXX'},{label:'Secret Access Key',placeholder:''},{label:'Bucket',placeholder:'my-bucket'}],                                                               glow:'rgba(35,47,62,0.35)'     },
  // ── Productivity ──
  { id:13, name:'Microsoft Excel',  emoji:'\u{1F4D7}', bg:'#1D6F42', category:'productivity',  connected:false, desc:'Import, export, and sync Excel spreadsheets. Auto-generate reports and push live data from Codex Teams directly into your workbooks.',  tags:['spreadsheet','reports','xlsx'],  fields:[{label:'Microsoft Account Email',placeholder:'you@company.com'},{label:'OneDrive Folder Path',placeholder:'/Documents/Reports'},{label:'Target Workbook',placeholder:'devtalk-data.xlsx'},{label:'Sheet Name',placeholder:'Sheet1'}],        glow:'rgba(29,111,66,0.4)'     },
  { id:14, name:'Figma',            emoji:'\u{1F3A8}', bg:'#1E1E1E', category:'productivity',  connected:false, desc:'Link Figma files, share design previews, inspect components, and post prototype comments inside any Codex Teams channel.',             tags:['design','ui/ux','prototypes'],   fields:[{label:'Personal Access Token',placeholder:'figd_xxxxxxxxxxxx'},{label:'Team ID',placeholder:'your-figma-team-id'}],                                                                                           glow:'rgba(162,89,255,0.35)'   },
  { id:15, name:'Loom',             emoji:'\u{1F3A5}', bg:'#625DF5', category:'productivity',  connected:false, desc:'Share Loom recordings inline with instant previews, auto-transcripts, and AI-generated chapter summaries.',                        tags:['video','async','recordings'],    fields:[{label:'API Key',placeholder:'your-loom-api-key'}],                                                                                                                                                        glow:'rgba(98,93,245,0.35)'    },
  { id:16, name:'Google Calendar',  emoji:'\u{1F4C5}', bg:'#4285F4', category:'productivity',  connected:false, desc:'Create events, set reminders, and sync meetings from Codex Teams channels directly to your Google Calendar.',                          tags:['calendar','meetings','events'],  fields:[{label:'OAuth Client ID',placeholder:'xxxx.apps.googleusercontent.com'},{label:'OAuth Client Secret',placeholder:'GOCSPX-...'}],                                                                           glow:'rgba(66,133,244,0.35)'   },
  { id:17, name:'Asana',            emoji:'\u{1F5C2}\uFE0F',bg:'#F06A6A',category:'productivity',connected:false,desc:'Create tasks, assign owners, set due dates, and track project progress without leaving Codex Teams.',                                tags:['tasks','projects','teams'],      fields:[{label:'Personal Access Token',placeholder:'1/xxxxxxxxxxxxxxxxxx'},{label:'Workspace ID',placeholder:'your-workspace-id'}],                                                                                  glow:'rgba(240,106,106,0.35)'  },
  { id:18, name:'Grammarly',        emoji:'\u270D\uFE0F',bg:'#15C39A', category:'productivity', connected:false, desc:'Instantly check grammar, tone, and clarity for all messages written in Codex Teams before you hit send.',                             tags:['writing','grammar','ai'],        fields:[{label:'API Key',placeholder:'grammarly-api-key'}],                                                                                                                                                        glow:'rgba(21,195,154,0.35)'   },
  { id:19, name:'Microsoft To Do',  emoji:'\u2705',    bg:'#2564CF', category:'productivity',  connected:false, desc:'Turn Codex Teams messages into To Do tasks instantly. Sync lists, set reminders, and track personal and team to-dos.',                 tags:['tasks','todo','microsoft'],      fields:[{label:'Microsoft Account Email',placeholder:'you@outlook.com'},{label:'Default List',placeholder:'Codex Teams Tasks'}],                                                                                       glow:'rgba(37,100,207,0.35)'   },
  { id:20, name:'Miro',             emoji:'\u{1F5BC}\uFE0F',bg:'#FFD02F',category:'productivity',connected:false,desc:'Embed Miro boards and whiteboards inline in channels. Brainstorm, diagram, and plan visually with your team.',                  tags:['whiteboard','diagrams','visual'],fields:[{label:'Access Token',placeholder:'your-miro-access-token'},{label:'Team ID',placeholder:'your-miro-team-id'}],                                                                      glow:'rgba(255,208,47,0.22)'   },
];

// ── Custom templates ───────────────────────────────────────────────────────────
const CUSTOM_TEMPLATES: CustomTemplate[] = [
  {
    name:'GitHub', emoji:'🐙', bg:'#161b22', category:'devtools', featured:true, badge:'Popular',
    desc:'Connect GitHub to sync repos, automate CI/CD pipelines, review PRs, and post commit activity directly into Codex Teams channels.',
    tags:['git','ci/cd','repos','webhooks'],
    fields:[
      {label:'Personal Access Token', placeholder:'ghp_xxxxxxxxxxxxxxxxxxxx'},
      {label:'Organization / Username', placeholder:'your-org-or-username'},
      {label:'Repository (optional)', placeholder:'my-repo'},
      {label:'Webhook Secret', placeholder:'your-webhook-secret'},
    ],
    glow:'rgba(36,41,47,0.45)',
  },
  {
    name:'Microsoft Excel', emoji:'📗', bg:'#1D6F42', category:'productivity', featured:true, badge:'New',
    desc:'Import, export, and sync Excel spreadsheets. Auto-generate reports and push live data from Codex Teams directly into your workbooks.',
    tags:['spreadsheet','reports','data','xlsx'],
    fields:[
      {label:'Microsoft Account Email', placeholder:'you@company.com'},
      {label:'OneDrive Folder Path', placeholder:'/Documents/Reports'},
      {label:'Target Workbook', placeholder:'devtalk-data.xlsx'},
      {label:'Sheet Name', placeholder:'Sheet1'},
    ],
    glow:'rgba(29,111,66,0.45)',
  },
  {
    name:'Linear', emoji:'🔷', bg:'#5E6AD2', category:'devtools', badge:'Trending',
    desc:'Sync Linear issues, cycles, and project milestones with your Codex Teams workspace for seamless engineering updates.',
    tags:['issues','sprints','product'],
    fields:[
      {label:'API Key', placeholder:'lin_api_xxxxxxxxxxxx'},
      {label:'Team ID', placeholder:'your-team-id'},
    ],
    glow:'rgba(94,106,210,0.35)',
  },
  {
    name:'Figma', emoji:'🎨', bg:'#1E1E1E', category:'productivity', badge:'Design',
    desc:'Link Figma files, share design previews, inspect components, and post prototype comments inside any Codex Teams channel.',
    tags:['design','prototypes','ui/ux'],
    fields:[
      {label:'Personal Access Token', placeholder:'figd_xxxxxxxxxxxx'},
      {label:'Team ID', placeholder:'your-figma-team-id'},
    ],
    glow:'rgba(162,89,255,0.3)',
  },
  {
    name:'PagerDuty', emoji:'🚨', bg:'#06AC38', category:'communication',
    desc:'Route incident alerts to Codex Teams channels instantly with one-click acknowledge, resolve, and escalation actions.',
    tags:['incidents','alerts','on-call'],
    fields:[
      {label:'API Key', placeholder:'your-pagerduty-api-key'},
      {label:'Service ID', placeholder:'PXXXXXX'},
    ],
    glow:'rgba(6,172,56,0.3)',
  },
  {
    name:'Airtable', emoji:'🟦', bg:'#FCB400', category:'storage',
    desc:'Read and write Airtable bases, trigger automations, and display live records inside Codex Teams messages.',
    tags:['database','no-code','sheets'],
    fields:[
      {label:'API Key', placeholder:'keyXXXXXXXXXXXXXX'},
      {label:'Base ID', placeholder:'appXXXXXXXXXXXXXX'},
    ],
    glow:'rgba(252,180,0,0.22)',
  },
  {
    name:'Zoom', emoji:'📹', bg:'#2D8CFF', category:'communication',
    desc:'Create and join Zoom meetings instantly from any Codex Teams channel or DM with automatic calendar invites.',
    tags:['video','meetings','calls'],
    fields:[
      {label:'OAuth Client ID', placeholder:'your-zoom-client-id'},
      {label:'OAuth Client Secret', placeholder:'your-zoom-client-secret'},
    ],
    glow:'rgba(45,140,255,0.3)',
  },
  {
    name:'Loom', emoji:'🎥', bg:'#625DF5', category:'productivity',
    desc:'Share Loom recordings inline with instant previews, auto-transcripts, and chapter summaries.',
    tags:['video','async','recordings'],
    fields:[
      {label:'API Key', placeholder:'your-loom-api-key'},
    ],
    glow:'rgba(98,93,245,0.3)',
  },
  {
    name:'Custom Webhook', emoji:'🔗', bg:'#374151', category:'devtools',
    desc:'Connect any third-party service using a custom incoming or outgoing webhook. Full control over payloads and events.',
    tags:['webhook','custom','api'],
    fields:[
      {label:'Integration Name', placeholder:'My Custom App'},
      {label:'Webhook URL', placeholder:'https://your-service.com/webhook'},
      {label:'Secret Token (optional)', placeholder:'your-secret'},
      {label:'Events to Subscribe', placeholder:'message.created, channel.updated'},
    ],
    glow:'rgba(55,65,81,0.35)',
  },
];

const NAV_BROWSE = [
  { key:'all' as Category,       label:'All',       Icon:LayoutGrid   },
  { key:'connected' as Category, label:'Connected', Icon:CheckCircle2 },
];
const NAV_CATEGORIES = [
  { key:'communication' as Category, label:'Communication', Icon:MessageSquare },
  { key:'storage' as Category,       label:'Storage',        Icon:Database      },
  { key:'analytics' as Category,     label:'Analytics',      Icon:BarChart2     },
  { key:'crm' as Category,           label:'CRM',             Icon:Users         },
  { key:'devtools' as Category,      label:'Dev Tools',       Icon:Code2         },
  { key:'productivity' as Category,  label:'Productivity',    Icon:Sparkles      },
];

const CATEGORY_PILLS = ['', 'devtools', 'communication', 'storage', 'analytics', 'productivity'];

// ── Page component ─────────────────────────────────────────────────────────────
export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [activeFilter, setActiveFilter] = useState<Category>('all');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [modalId,      setModalId]      = useState<number | null>(null);
  const [fieldValues,  setFieldValues]  = useState<Record<string, string>>({});
  const [toast,        setToast]        = useState<{ msg: string; visible: boolean }>({ msg:'', visible:false });

  // Add Custom flow
  const [showAddCustom,    setShowAddCustom]    = useState(false);
  const [customSearch,     setCustomSearch]     = useState('');
  const [customCategory,   setCustomCategory]   = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [customFields,     setCustomFields]     = useState<Record<string, string>>({});
  const [showBlankForm,    setShowBlankForm]    = useState(false);
  const [blankForm, setBlankForm] = useState({ name:'', emoji:'🔌', bg:'#374151', desc:'', tags:'', webhookUrl:'', apiKey:'', secret:'' });

  // Productivity Drawer
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [drawerSettings, setDrawerSettings] = useState<Record<string, any>>({});
  const drawerItem = integrations.find(i => i.id === drawerId) ?? null;

  const connectedCount = integrations.filter(i => i.connected).length;
  const availableCount = integrations.length - connectedCount;

  const filtered = integrations.filter(i => {
    const q = searchQuery.toLowerCase();
    const match = !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q);
    if (!match) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'connected') return i.connected;
    return i.category === activeFilter;
  });

  const connectedList  = filtered.filter(i => i.connected);
  const availableList  = filtered.filter(i => !i.connected);
  const modalItem      = integrations.find(i => i.id === modalId) ?? null;
  const filteredTpls   = CUSTOM_TEMPLATES.filter(t => {
    const q = customSearch.toLowerCase();
    return (!customCategory || t.category === customCategory) &&
      (!q || t.name.toLowerCase().includes(q) || t.tags.some(tg => tg.includes(q)));
  });

  function showToast(msg: string) {
    setToast({ msg, visible:true });
    setTimeout(() => setToast(s => ({ ...s, visible:false })), 3200);
  }

  function handleAction(id: number) {
    const item = integrations.find(i => i.id === id)!;
    if (item.connected) {
      if (item.category === 'productivity') {
        openDrawer(id);
      } else {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected:false } : i));
        showToast(`${item.name} disconnected`);
      }
    } else {
      setFieldValues({});
      setModalId(id);
    }
  }

  function openDrawer(id: number) {
    const item = integrations.find(i => i.id === id)!;
    const features = PROD_FEATURES[item.name] || DEFAULT_PROD_FEATURES;
    const defaults: Record<string, any> = {};
    features.forEach(f => defaults[f.settingKey] = f.default);
    setDrawerSettings(defaults);
    setDrawerId(id);
  }

  function toggleDrawerSetting(key: string) {
    setDrawerSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function disconnectFromDrawer() {
    if (!drawerItem) return;
    setIntegrations(prev => prev.map(i => i.id === drawerItem.id ? { ...i, connected:false } : i));
    showToast(`${drawerItem.name} disconnected`);
    setDrawerId(null);
  }

  function confirmConnect() {
    if (!modalItem) return;
    setIntegrations(prev => prev.map(i => i.id === modalItem.id ? { ...i, connected:true } : i));
    showToast(`${modalItem.name} connected successfully!`);
    setModalId(null);
  }

  function openAddCustom() {
    setShowAddCustom(true); setSelectedTemplate(null);
    setCustomSearch(''); setCustomCategory(''); setShowBlankForm(false);
  }

  function selectTemplate(t: CustomTemplate) {
    setSelectedTemplate(t); setCustomFields({});
  }

  function confirmCustomConnect() {
    if (!selectedTemplate) return;
    setIntegrations(prev => [...prev, {
      id: Date.now(), name: selectedTemplate.name, emoji: selectedTemplate.emoji,
      bg: selectedTemplate.bg, category: selectedTemplate.category, connected: true,
      desc: selectedTemplate.desc, tags: selectedTemplate.tags,
      fields: selectedTemplate.fields, glow: selectedTemplate.glow, custom: true,
    }]);
    showToast(`${selectedTemplate.name} connected successfully!`);
    setSelectedTemplate(null); setShowAddCustom(false);
  }

  function confirmBlankCustom() {
    if (!blankForm.name.trim()) return;
    setIntegrations(prev => [...prev, {
      id: Date.now(), name: blankForm.name, emoji: blankForm.emoji, bg: blankForm.bg,
      category: 'devtools', connected: true,
      desc: blankForm.desc || `Custom integration: ${blankForm.name}`,
      tags: blankForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      fields: [], glow: 'rgba(55,65,81,0.35)', custom: true,
    }]);
    showToast(`${blankForm.name} added!`);
    setShowBlankForm(false); setShowAddCustom(false);
    setBlankForm({ name:'', emoji:'🔌', bg:'#374151', desc:'', tags:'', webhookUrl:'', apiKey:'', secret:'' });
  }

  return (
    <div className="flex flex-col h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2c33] shrink-0">
        <div className="flex items-center gap-2.5">
          <LayoutGrid size={18} className="text-[#a855f7]" />
          <h1 className="text-[16px] font-bold tracking-tight">Integrations</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#18191d] border border-[#2a2c33] rounded-lg px-3 py-1.5 w-[200px] focus-within:border-[#7c3aed] transition-colors">
            <Search size={12} className="text-[#6b7280] shrink-0" />
            <input type="text" placeholder="Search integrations..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e8eaf0] text-[12px] w-full placeholder-[#6b7280] font-mono" />
          </div>
          <button onClick={openAddCustom}
            className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition-all hover:-translate-y-px">
            <Plus size={13} strokeWidth={2.5} /> Add Custom
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[200px] border-r border-[#2a2c33] flex flex-col gap-0.5 px-2.5 py-4 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-2 pb-1">Browse</p>
          {NAV_BROWSE.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-all text-left w-full
                ${activeFilter === key ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'}`}>
              <Icon size={14} />{label}
              <span className="ml-auto bg-[#1e2026] border border-[#33363f] rounded-full font-mono text-[9px] px-1.5 py-px text-[#6b7280]">
                {key === 'all' ? integrations.length : connectedCount}
              </span>
            </button>
          ))}
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] px-2 pt-4 pb-1">Category</p>
          {NAV_CATEGORIES.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium transition-all text-left w-full
                ${activeFilter === key ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-4 gap-2.5 mb-6">
            {[
              { label:'Total',     val:integrations.length, color:'#e8eaf0' },
              { label:'Connected', val:connectedCount,       color:'#10b981' },
              { label:'Available', val:availableCount,       color:'#c084fc' },
              { label:'Syncing',   val:2,                    color:'#3b82f6' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-[#18191d] border border-[#2a2c33] rounded-xl px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.07em] text-[#6b7280] mb-1">{label}</p>
                <p className="text-[22px] font-extrabold leading-none tracking-tight" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          {connectedList.length > 0 && (
            <section className="mb-7">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[12px] font-semibold text-[#6b7280] uppercase tracking-[0.05em]">Connected</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">Active</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {connectedList.map(item => <IntegrationCard key={item.id} item={item} onAction={handleAction} />)}
              </div>
            </section>
          )}

          {availableList.length > 0 && activeFilter !== 'connected' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[12px] font-semibold text-[#6b7280] uppercase tracking-[0.05em]">Available</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[rgba(124,58,237,0.12)] text-[#c084fc] border border-[rgba(124,58,237,0.25)]">Browse</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {availableList.map(item => <IntegrationCard key={item.id} item={item} onAction={handleAction} />)}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#6b7280]">
              <Zap size={28} className="opacity-30" />
              <p className="font-mono text-sm">No integrations found</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Connect existing modal ── */}
      {modalItem && (
        <Overlay onClose={() => setModalId(null)}>
          <div className="bg-[#18191d] border border-[#33363f] rounded-2xl p-6 w-[440px] max-w-[95vw]"
            style={{ animation:'slideUp 0.2s ease' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:modalItem.bg }}>{modalItem.emoji}</div>
              <div>
                <p className="text-[17px] font-bold">Connect {modalItem.name}</p>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">{modalItem.desc}</p>
              </div>
              <button onClick={() => setModalId(null)} className="ml-auto w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center"><X size={14} /></button>
            </div>
            {modalItem.fields.map(f => (
              <div key={f.label} className="mb-3">
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={fieldValues[f.label] ?? ''}
                  onChange={e => setFieldValues(prev => ({ ...prev, [f.label]:e.target.value }))}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono text-[12.5px] outline-none transition-colors placeholder-[#6b7280]" />
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-5">
              <Btn ghost onClick={() => setModalId(null)}>Cancel</Btn>
              <Btn onClick={confirmConnect}><Check size={13} strokeWidth={2.5} /> Connect</Btn>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ ADD CUSTOM — template browser ══ */}
      {showAddCustom && !selectedTemplate && !showBlankForm && (
        <Overlay onClose={() => setShowAddCustom(false)}>
          <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[820px] max-w-[96vw] max-h-[88vh] flex flex-col overflow-hidden"
            style={{ animation:'slideUp 0.22s ease' }}>

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2c33] shrink-0">
              <div>
                <p className="text-[17px] font-bold flex items-center gap-2"><Plus size={16} className="text-[#a855f7]" /> Add Custom Integration</p>
                <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">Pick a template or build your own from scratch</p>
              </div>
              <button onClick={() => setShowAddCustom(false)} className="w-8 h-8 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center"><X size={15} /></button>
            </div>

            {/* search + filter */}
            <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#2a2c33] shrink-0">
              <div className="flex items-center gap-2 bg-[#1e2026] border border-[#2a2c33] rounded-lg px-3 py-1.5 flex-1 focus-within:border-[#7c3aed] transition-colors">
                <Search size={12} className="text-[#6b7280] shrink-0" />
                <input type="text" placeholder="Search templates…" value={customSearch}
                  onChange={e => setCustomSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-[#e8eaf0] text-[12px] w-full placeholder-[#6b7280] font-mono" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {CATEGORY_PILLS.map(cat => (
                  <button key={cat} onClick={() => setCustomCategory(cat)}
                    className={`font-mono text-[10.5px] px-2.5 py-1 rounded-full border transition-all
                      ${customCategory === cat ? 'bg-[rgba(124,58,237,0.2)] text-[#c084fc] border-[rgba(124,58,237,0.4)]' : 'text-[#6b7280] border-[#2a2c33] hover:border-[#33363f] hover:text-[#e8eaf0]'}`}>
                    {cat || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!customCategory && !customSearch && (
                <div className="mb-6">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3 flex items-center gap-1.5">
                    <Star size={10} className="text-[#f59e0b]" /> Featured
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {CUSTOM_TEMPLATES.filter(t => t.featured).map(t => (
                      <TemplateCard key={t.name} template={t} onSelect={selectTemplate} featured />
                    ))}
                  </div>
                </div>
              )}
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">
                {customSearch || customCategory ? 'Search Results' : 'All Templates'}
                <span className="ml-2 text-[#33363f]">({filteredTpls.length})</span>
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {filteredTpls.map(t => <TemplateCard key={t.name} template={t} onSelect={selectTemplate} />)}
              </div>
              {filteredTpls.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#6b7280]">
                  <Zap size={24} className="opacity-30" />
                  <p className="font-mono text-sm">No templates match</p>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#2a2c33] bg-[#111214] shrink-0">
              <p className="font-mono text-[11px] text-[#6b7280]">Don't see what you need?</p>
              <button onClick={() => setShowBlankForm(true)}
                className="flex items-center gap-1 text-[#a855f7] hover:text-[#c084fc] font-semibold text-[12px] transition-colors">
                Build from scratch <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ ADD CUSTOM — template connect form ══ */}
      {showAddCustom && selectedTemplate && (
        <Overlay onClose={() => setSelectedTemplate(null)}>
          <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[500px] max-w-[95vw] max-h-[88vh] flex flex-col overflow-hidden"
            style={{ animation:'slideUp 0.2s ease' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2a2c33] shrink-0">
              <button onClick={() => setSelectedTemplate(null)} className="font-mono text-[11.5px] text-[#6b7280] hover:text-[#e8eaf0] transition-colors">← Back</button>
              <button onClick={() => { setSelectedTemplate(null); setShowAddCustom(false); }} className="ml-auto w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Integration preview banner */}
              <div className="flex items-start gap-4 mb-5 p-4 bg-[#1e2026] rounded-xl border border-[#2a2c33]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background:selectedTemplate.bg }}>{selectedTemplate.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[16px] font-bold">{selectedTemplate.name}</p>
                    {selectedTemplate.badge && <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[rgba(124,58,237,0.2)] text-[#c084fc] border border-[rgba(124,58,237,0.3)]">{selectedTemplate.badge}</span>}
                  </div>
                  <p className="font-mono text-[11.5px] text-[#6b7280] leading-relaxed">{selectedTemplate.desc}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {selectedTemplate.tags.map(t => <span key={t} className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-[#111214] text-[#6b7280] border border-[#2a2c33]">{t}</span>)}
                  </div>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Configuration</p>
              {selectedTemplate.fields.map(f => (
                <div key={f.label} className="mb-3">
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{f.label}</label>
                  <input
                    type={/secret|token|key|password/i.test(f.label) ? 'password' : 'text'}
                    placeholder={f.placeholder} value={customFields[f.label] ?? ''}
                    onChange={e => setCustomFields(prev => ({ ...prev, [f.label]:e.target.value }))}
                    className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono text-[12.5px] outline-none transition-colors placeholder-[#6b7280]" />
                </div>
              ))}
              <div className="flex items-start gap-2 mt-4 p-3 bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.2)] rounded-lg">
                <Zap size={13} className="text-[#a855f7] shrink-0 mt-0.5" />
                <p className="font-mono text-[10.5px] text-[#9ca3af] leading-relaxed">Credentials are stored securely. Codex Teams requests only the minimum required permissions.</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-[#2a2c33] bg-[#111214] shrink-0">
              <Btn ghost onClick={() => setSelectedTemplate(null)}>Back</Btn>
              <Btn onClick={confirmCustomConnect}><Check size={13} strokeWidth={2.5} /> Connect {selectedTemplate.name}</Btn>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ ADD CUSTOM — blank builder ══ */}
      {showAddCustom && showBlankForm && (
        <Overlay onClose={() => setShowBlankForm(false)}>
          <div className="bg-[#16171b] border border-[#2a2c33] rounded-2xl w-[500px] max-w-[95vw] max-h-[88vh] flex flex-col overflow-hidden"
            style={{ animation:'slideUp 0.2s ease' }}>
            <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2a2c33] shrink-0">
              <button onClick={() => setShowBlankForm(false)} className="font-mono text-[11.5px] text-[#6b7280] hover:text-[#e8eaf0] transition-colors">← Back</button>
              <p className="text-[15px] font-bold ml-2">Build from Scratch</p>
              <button onClick={() => { setShowBlankForm(false); setShowAddCustom(false); }} className="ml-auto w-7 h-7 bg-[#1e2026] border border-[#2a2c33] rounded-lg text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              <div className="flex gap-3 items-end">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Icon</label>
                  <input type="text" maxLength={2} value={blankForm.emoji}
                    onChange={e => setBlankForm(p => ({ ...p, emoji:e.target.value }))}
                    className="w-14 bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-2 py-2 text-center text-xl outline-none transition-colors" />
                </div>
                <div className="flex-1">
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Integration Name *</label>
                  <input type="text" placeholder="My Custom App" value={blankForm.name}
                    onChange={e => setBlankForm(p => ({ ...p, name:e.target.value }))}
                    className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono text-[12.5px] outline-none transition-colors placeholder-[#6b7280]" />
                </div>
              </div>
              {[
                { key:'desc',       label:'Description',              ph:'What does this integration do?',  type:'text'     },
                { key:'tags',       label:'Tags (comma-separated)',   ph:'api, webhook, crm',               type:'text'     },
                { key:'webhookUrl', label:'Webhook URL',              ph:'https://your-service.com/hook',   type:'text'     },
                { key:'apiKey',     label:'API Key',                  ph:'your-api-key',                    type:'password' },
                { key:'secret',     label:'Secret Token (optional)',  ph:'your-secret-token',               type:'password' },
              ].map(({ key, label, ph, type }) => (
                <div key={key}>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} value={(blankForm as Record<string,string>)[key]}
                    onChange={e => setBlankForm(p => ({ ...p, [key]:e.target.value }))}
                    className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] rounded-lg px-3 py-2 text-[#e8eaf0] font-mono text-[12.5px] outline-none transition-colors placeholder-[#6b7280]" />
                </div>
              ))}
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Card Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={blankForm.bg} onChange={e => setBlankForm(p => ({ ...p, bg:e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-[#2a2c33] bg-transparent cursor-pointer" />
                  <span className="font-mono text-[11px] text-[#6b7280]">{blankForm.bg}</span>
                  <div className="ml-auto w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-[#2a2c33]" style={{ background:blankForm.bg }}>{blankForm.emoji}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t border-[#2a2c33] bg-[#111214] shrink-0">
              <Btn ghost onClick={() => setShowBlankForm(false)}>Cancel</Btn>
              <button onClick={confirmBlankCustom} disabled={!blankForm.name.trim()}
                className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold px-5 py-2 rounded-lg transition-all">
                <Plus size={13} strokeWidth={2.5} /> Add Integration
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Toast */}
      <div className={`fixed bottom-5 right-5 flex items-center gap-2 bg-[#18191d] border border-[#10b981] rounded-xl px-4 py-2.5 text-[#10b981] font-semibold text-[13px] shadow-2xl z-[300] transition-all duration-300
        ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
        <Check size={14} strokeWidth={2.5} />{toast.msg}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(18px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* ── Productivity Drawer ── */}
      {drawerItem && (
        <div className="fixed inset-0 z-[200] flex justify-end"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if(e.target === e.currentTarget) setDrawerId(null); }}>
          <div className="w-[500px] h-full bg-[#111214] border-l border-[#2a2c33] shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>

            {/* drawer header */}
            <div className="p-6 border-b border-[#2a2c33] flex items-center justify-between shrink-0"
              style={{ background: `linear-gradient(to bottom right, ${drawerItem.glow.replace('0.35','0.15')}, transparent)` }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0" style={{ background:drawerItem.bg }}>{drawerItem.emoji}</div>
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight">{drawerItem.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_5px_#10b981]" />
                    <span className="font-mono text-[11px] text-[#10b981] font-semibold uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDrawerId(null)} className="w-9 h-9 bg-[#18191d] border border-[#2a2c33] rounded-xl text-[#6b7280] hover:text-[#e8eaf0] flex items-center justify-center transition-colors"><X size={18} /></button>
            </div>

            {/* drawer scroll area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* about */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#6b7280] mb-3">About Integration</h3>
                <p className="font-mono text-[13px] text-[#9ca3af] leading-relaxed italic">"{drawerItem.desc}"</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {drawerItem.tags.map(t => <span key={t} className="font-mono text-[10px] px-2 py-1 rounded-full bg-[#18191d] text-[#6b7280] border border-[#2a2c33]">{t}</span>)}
                </div>
              </div>

              {/* features & settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#6b7280]">Advanced Features</h3>
                  <Sparkles size={12} className="text-[#a855f7]" />
                </div>
                <div className="space-y-3">
                  {(PROD_FEATURES[drawerItem.name] || DEFAULT_PROD_FEATURES).map(feat => (
                    <div key={feat.settingKey} className="group bg-[#18191d] border border-[#2a2c33] hover:border-[#33363f] p-4 rounded-xl transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#111214] border border-[#2a2c33] flex items-center justify-center text-[#a855f7] shrink-0 group-hover:scale-110 transition-transform">
                            {feat.icon}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#e8eaf0]">{feat.title}</p>
                            <p className="font-mono text-[11px] text-[#6b7280] leading-snug mt-1">{feat.desc}</p>
                          </div>
                        </div>
                        {feat.type === 'toggle' ? (
                          <button onClick={() => toggleDrawerSetting(feat.settingKey)}
                            className={`shrink-0 transition-colors ${drawerSettings[feat.settingKey] ? 'text-[#7c3aed]' : 'text-[#33363f]'}`}>
                            {drawerSettings[feat.settingKey] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                          </button>
                        ) : (
                          <div className="relative group/sel">
                            <select value={drawerSettings[feat.settingKey]}
                               onChange={e => setDrawerSettings(p => ({...p, [feat.settingKey]: e.target.value}))}
                               className="bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[11px] rounded-lg px-3 py-1.5 pr-8 appearance-none outline-none focus:border-[#7c3aed]">
                               {feat.options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <ChevronRight size={10} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[#6b7280] pointer-events-none" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* danger zone */}
              <div className="pt-4 mt-4 border-t border-[#2a2c33]">
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#ef4444] mb-4">Danger Zone</h3>
                <button onClick={disconnectFromDrawer}
                  className="w-full flex items-center justify-between p-4 bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)] hover:bg-[rgba(239,68,68,0.1)] hover:border-[rgba(239,68,68,0.2)] rounded-xl group transition-all">
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-[#ef4444]">Disconnect Integration</p>
                    <p className="font-mono text-[10.5px] text-[#6b7280] mt-0.5">Remove this app and all its settings.</p>
                  </div>
                  <X size={16} className="text-[#ef4444] opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            {/* drawer footer */}
            <div className="p-6 border-t border-[#2a2c33] bg-[#18191d] shrink-0">
               <button onClick={() => { showToast('Settings saved successfully!'); setDrawerId(null); }}
                  className="w-full bg-[#111214] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] font-bold text-[14px] py-3 rounded-xl transition-all active:scale-[0.98]">
                  Save Configuration
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared small components ────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, ghost, disabled }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-40
        ${ghost
          ? 'bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] hover:border-[#33363f]'
          : 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'}`}>
      {children}
    </button>
  );
}

// ── Integration Card ───────────────────────────────────────────────────────────
function IntegrationCard({ item, onAction }: { item: Integration; onAction: (id: number) => void }) {
  return (
    <div className="group relative bg-[#18191d] border border-[#2a2c33] rounded-xl p-4 overflow-hidden hover:border-[#33363f] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-all duration-200">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{ background:`radial-gradient(circle at top right, ${item.glow} 0%, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-[9px] flex items-center justify-center text-[19px] shrink-0" style={{ background:item.bg }}>{item.emoji}</div>
        <div className={`flex items-center gap-1.5 font-mono text-[10.5px] font-medium ${item.connected ? 'text-[#10b981]' : 'text-[#6b7280]'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.connected ? 'bg-[#10b981] shadow-[0_0_5px_#10b981]' : 'bg-[#33363f]'}`} />
          {item.connected ? 'Connected' : 'Not connected'}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <p className="text-[14px] font-bold tracking-tight">{item.name}</p>
        {item.custom && <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-[rgba(124,58,237,0.15)] text-[#a855f7] border border-[rgba(124,58,237,0.2)]">custom</span>}
      </div>
      <p className="font-mono text-[12px] font-light text-[#6b7280] leading-[1.5] mb-3.5">{item.desc}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {item.tags.map(t => <span key={t} className="font-mono text-[9.5px] px-1.5 py-0.5 rounded bg-[#1e2026] text-[#6b7280] border border-[#2a2c33]">{t}</span>)}
        </div>
        <button onClick={e => { e.stopPropagation(); onAction(item.id); }}
          className={`shrink-0 font-semibold text-[11.5px] px-3 py-1.5 rounded-lg border transition-all
            ${item.connected
              ? 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-[rgba(16,185,129,0.25)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.25)]'
              : 'bg-[#7c3aed] text-white border-transparent hover:bg-[#a855f7]'}`}>
          {item.connected ? 'Connected ✓' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────────────────
function TemplateCard({ template: t, onSelect, featured }: { template: CustomTemplate; onSelect: (t: CustomTemplate) => void; featured?: boolean }) {
  return (
    <button onClick={() => onSelect(t)}
      className={`group relative text-left w-full bg-[#1e2026] border rounded-xl p-4 overflow-hidden hover:border-[#7c3aed] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition-all duration-150
        ${featured ? 'border-[rgba(124,58,237,0.3)]' : 'border-[#2a2c33]'}`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
        style={{ background:`radial-gradient(circle at top right, ${t.glow} 0%, transparent 65%)` }} />
      <div className="flex items-center gap-3 mb-2.5">
        <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[17px] shrink-0" style={{ background:t.bg }}>{t.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-bold truncate">{t.name}</p>
            {t.badge && <span className="shrink-0 font-mono text-[8.5px] px-1.5 py-0.5 rounded bg-[rgba(124,58,237,0.18)] text-[#c084fc] border border-[rgba(124,58,237,0.3)]">{t.badge}</span>}
          </div>
          <p className="font-mono text-[9px] text-[#6b7280] capitalize">{t.category}</p>
        </div>
        <ChevronRight size={13} className="text-[#33363f] group-hover:text-[#a855f7] shrink-0 transition-colors" />
      </div>
      <p className="font-mono text-[11px] text-[#6b7280] leading-relaxed line-clamp-2">{t.desc}</p>
      <div className="flex gap-1 mt-2.5 flex-wrap">
        {t.tags.slice(0,3).map(tag => <span key={tag} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#111214] text-[#6b7280] border border-[#1e2026]">{tag}</span>)}
      </div>
    </button>
  );
}
