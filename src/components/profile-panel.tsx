'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Edit3, Check, X, Bell, BellOff, Shield,
  LogOut, Trash2, ChevronRight, Moon, Sun, Monitor,
  Twitter, Github, Globe, Copy, CheckCheck,
  MessageSquare, Hash, Users, Clock, TrendingUp,
  Settings, Eye, EyeOff, Upload, Palette, Zap,
  Lock, Key, Smartphone, AlertTriangle, Star,
  Activity, Calendar, ArrowRight, Plus, Minus,
  CreditCard, RefreshCw, Download, ExternalLink, Sparkles,
  QrCode, Loader2, Landmark, CheckCircle2, XCircle, ChevronDown, FileText, PieChart, Percent, ShieldAlert
} from 'lucide-react';
import { useAuth } from '@/database';
import { useRouter } from 'next/navigation';
import PrivacySettings from './privacy-settings';
import NotificationSettings from './notification-settings';
import AppearanceSettings from './appearance-settings';

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = 'online' | 'away' | 'busy' | 'offline';
type ThemeMode = 'dark' | 'light' | 'system';
type ActiveTab = 'profile' | 'account' | 'notifications' | 'appearance' | 'privacy' | 'billing';

interface UserProfile {
  name: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  role: string;
  status: Status;
  timezone: string;
  website: string;
  twitter: string;
  github: string;
  joinedDate: string;
  avatarGradient: string;
  avatarUrl: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; pulse?: boolean }> = {
  online: { label: 'Online', color: '#10b981', bg: 'rgba(16,185,129,0.15)', pulse: true },
  away: { label: 'Away', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  busy: { label: 'Do Not Disturb', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  offline: { label: 'Appear Offline', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #7c3aed, #3b82f6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #0ea5e9, #10b981)',
  'linear-gradient(135deg, #f97316, #eab308)',
  'linear-gradient(135deg, #6366f1, #ec4899)',
  'linear-gradient(135deg, #14b8a6, #3b82f6)',
];

const TIMEZONES = [
  'UTC-8 (Pacific)', 'UTC-5 (Eastern)', 'UTC+0 (London)',
  'UTC+1 (Paris)', 'UTC+2 (Cairo)', 'UTC+3 (Moscow)',
  'UTC+5:30 (India)', 'UTC+8 (Beijing)', 'UTC+9 (Tokyo)',
  'UTC+10 (Sydney)',
];

// ─────────────────────────────────────────────────────────────────────────────
export function ProfilePage({ user, activeWorkspace, refresh }: { user: any; activeWorkspace?: any; refresh?: () => Promise<void>; }) {
  const { supabase } = useAuth();
  const router = useRouter();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.display_name || user?.email?.split('@')[0] || 'Member',
    displayName: user?.display_name || user?.email?.split('@')[0] || 'Member',
    username: user?.username || user?.email?.split('@')[0] || 'user',
    email: user?.email || '',
    bio: user?.bio || 'No bio yet.',
    role: user?.role || 'Workspace Member',
    status: (user?.status as Status) || 'online',
    timezone: user?.timezone || 'UTC+0 (London)',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    joinedDate: user?.joined_date || new Date().toLocaleDateString(),
    avatarGradient: user?.avatar_gradient || GRADIENT_PRESETS[0],
    avatarUrl: user?.profile_picture_url || user?.avatar_url || '',
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [showEmail, setShowEmail] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── ID Card state ──────────────────────────────────────────────────────────
  const [showCard, setShowCard] = useState(false);
  const [idCardStatus, setIdCardStatus] = useState<'none' | 'pending' | 'issued'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [idCardIssuedAt, setIdCardIssuedAt] = useState<string | null>(null);
  const [issuedCardData, setIssuedCardData] = useState<any>(null);

  // ── Billing state ──────────────────────────────────────────────────────────
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'business' | 'enterprise'>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [billingSubTab, setBillingSubTab] = useState<'plans' | 'methods'>('plans');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [cardControls, setCardControls] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [addStep, setAddStep] = useState<'pick' | 'form' | 'verifying'>('pick');
  const [addType, setAddType] = useState<'card' | 'upi' | 'paypal' | 'gpay' | null>(null);
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  const [upgradingToPlan, setUpgradingToPlan] = useState<string | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // Form fields
  const [formCard, setFormCard] = useState({ number: '', exp: '', cvv: '', name: '' });
  const [formUpi, setFormUpi] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLimit, setFormLimit] = useState('5000');
  const [upiError, setUpiError] = useState('');
  const [upiSteps, setUpiSteps] = useState<{ label: string; status: 'pending' | 'active' | 'done' | 'error' }[]>([]);

  // ── Auth / Password state ──────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // ── MFA state ─────────────────────────────────────────────────────────────
  const [mfaStatus, setMfaStatus] = useState<'loading' | 'enabled' | 'disabled'>('loading');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [showMfaModal, setShowMfaModal] = useState(false);

  // ── ID Card Request Form ──────────────────────────────────────────────────
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    designation: '',
    dob: '',
    signature: '',
    email: '',
    mobile_number: ''
  });

  // ── ID Card 3D Animation ──────────────────────────────────────────────────
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glareRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    
    // Calculate rotation limits (max 15 degrees)
    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateXValue}deg) rotateY(${rotateYValue}deg) scale3d(1.05, 1.05, 1.05)`;
    
    // Calculate glare position
    const percentageX = (x / box.width) * 100;
    const percentageY = (y / box.height) * 100;
    glareRef.current.style.background = `radial-gradient(circle at ${percentageX}% ${percentageY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
    glareRef.current.style.opacity = '1';
  };

  const handleCardMouseLeave = () => {
    if (!cardRef.current || !glareRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    glareRef.current.style.opacity = '0';
  };

  // ── Notification prefs ────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    mentions: true, threads: true, reactions: false,
    dms: true, keywords: true, sounds: true,
    desktop: true, mobile: false, email: false,
  });

  // ── Privacy prefs ─────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    showStatus: true, showEmail: false, showActivity: true,
    searchable: true, readReceipts: true, typingIndicator: true,
  });

  // ── Appearance prefs ──────────────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    compactMode: false, animations: true, fontSize: 'normal',
    sidebarDense: false, messageGrouping: true,
  });

  // ── Real stats ────────────────────────────────────────────────────────────
  const [realStats, setRealStats] = useState({ messages: 0, channels: 0, workspaces: 0, daysActive: 0 });
  const [realActivity, setRealActivity] = useState<any[]>([]);
  const [activityDays, setActivityDays] = useState<any[]>(
    Array.from({ length: 364 }, (_, i) => ({ week: Math.floor(i / 7), day: i % 7, count: 0 }))
  );

  // ── Database Interactions ─────────────────────────────────────────────────
  const checkExistingRequest = useCallback(async () => {
    if (!user?.id || !supabase || !activeWorkspace?.id) return;
    const { data } = await supabase
      .from('id_card_requests')
      .select('id, status, created_at, designation, dob, email, mobile_number, signature')
      .eq('user_id', user.id)
      .eq('workspace_id', activeWorkspace.id)
      .maybeSingle();

    if (data) {
      setIdCardStatus(data.status as 'pending' | 'issued');
      setRequestId(data.id);
      setIdCardIssuedAt(data.status === 'issued' ? data.created_at : null);
      if (data.status === 'issued') {
        setIssuedCardData(data);
      }
    } else {
      setIdCardStatus('none');
      setRequestId(null);
      setIdCardIssuedAt(null);
      setIssuedCardData(null);
    }
  }, [user?.id, supabase, activeWorkspace?.id]);

  const fetchUserData = useCallback(async () => {
    if (!user?.id || !supabase) return;

    const [{ count: msgCount }, { count: chanCount }, { count: wsCount }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('channel_memberships').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }),
    ]);

    const { data: allMsgs } = await supabase.from('messages').select('created_at').eq('author_id', user.id);
    const uniqueDays = new Set<string>();
    const dayCounts = new Map<string, number>();

    allMsgs?.forEach((m: any) => {
      const d = new Date(m.created_at).toISOString().split('T')[0];
      uniqueDays.add(d);
      dayCounts.set(d, (dayCounts.get(d) || 0) + 1);
    });

    const today = new Date();
    const actDays = Array.from({ length: 52 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (52 - week - 1) * 7 - (today.getDay() - day));
        const dateStr = d.toISOString().split('T')[0];
        return { week, day, count: dayCounts.get(dateStr) || 0 };
      })
    ).flat();

    setActivityDays(actDays);
    setRealStats({ messages: msgCount || 0, channels: chanCount || 0, workspaces: wsCount || 0, daysActive: uniqueDays.size });

    // MFA status
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (!factorsError && factors?.totp?.length > 0) {
      const activeTotp = factors.totp.find((f: any) => f.status === 'verified');
      if (activeTotp) { setMfaStatus('enabled'); setMfaFactorId(activeTotp.id); }
      else { setMfaStatus('disabled'); }
    } else {
      setMfaStatus('disabled');
    }

    // Recent activity
    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('created_at, content, channels(name)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentMsgs) {
      setRealActivity(recentMsgs.map((m: any) => {
        let timeStr = new Date(m.created_at).toLocaleDateString();
        const hrDiff = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 3600000);
        if (hrDiff < 24) timeStr = hrDiff === 0 ? 'Just now' : `${hrDiff}h ago`;
        else if (hrDiff < 48) timeStr = 'Yesterday';
        const cName = m.channels && !Array.isArray(m.channels) ? m.channels.name : 'channel';
        return { type: 'message', text: `Sent message in #${cName}`, time: timeStr, icon: '💬' };
      }));
    }
  }, [user?.id, supabase]);
  useEffect(() => { checkExistingRequest(); }, [checkExistingRequest]);
  useEffect(() => { fetchUserData(); }, [fetchUserData]);
  
  // Realtime subscription for ID Card updates
  useEffect(() => {
    if (!user?.id || !supabase || !activeWorkspace?.id) return;
    
    const channel = supabase.channel('id_card_updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'id_card_requests', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        if (payload.new.workspace_id === activeWorkspace.id) {
          if (payload.new.status === 'issued') {
            setIdCardStatus('issued');
            setIdCardIssuedAt(payload.new.created_at);
            setIssuedCardData(payload.new);
            showToast('ID Card Issued! Your official ID has been created.');
          }
        }
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'id_card_requests', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        if (payload.old.workspace_id === activeWorkspace.id || idCardStatus === 'pending') {
          setIdCardStatus('none');
          setRequestId(null);
          setIssuedCardData(null);
          showToast('ID Card Request was rejected or cancelled.');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase, activeWorkspace?.id, idCardStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    if (supabase) { await supabase.auth.signOut(); router.push('/login'); }
  };

  const handleRequestIDCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id || !supabase || !activeWorkspace?.id) return;
    setIsRequesting(true);
    const { data, error } = await supabase
      .from('id_card_requests')
      .insert({ 
        user_id: user.id, 
        workspace_id: activeWorkspace.id, 
        status: 'pending',
        designation: requestFormData.designation,
        dob: requestFormData.dob,
        signature: requestFormData.signature,
        email: requestFormData.email,
        mobile_number: requestFormData.mobile_number
      })
      .select().single();
    if (!error && data) { 
      setIdCardStatus('pending'); 
      setRequestId(data.id); 
      setShowRequestForm(false);
    }
    else if (error) { console.error('Failed to request ID card:', error.message); }
    setIsRequesting(false);
  };

  const handleCancelRequest = async () => {
    if (!requestId || !supabase) return;
    setIsRequesting(true);
    const { error } = await supabase.from('id_card_requests').delete().eq('id', requestId);
    if (!error) { setIdCardStatus('none'); setRequestId(null); }
    setIsRequesting(false);
  };

  async function handleUpdatePassword() {
    if (!newPassword || !confirmPassword) { setPasswordError('Please fill in all password fields.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    setPasswordLoading(true); setPasswordError(''); setPasswordSuccess('');
    const { error } = await supabase!.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    }
  }

  async function handleEnableMfa() {
    setShowMfaModal(true); setMfaLoading(true); setMfaError(''); setMfaCode('');
    const { data: enrollData, error: enrollError } = await supabase!.auth.mfa.enroll({ factorType: 'totp' });
    if (enrollError || !enrollData) { setMfaError(enrollError?.message || 'Failed to enroll MFA'); setMfaLoading(false); return; }
    setMfaFactorId(enrollData.id); setMfaQrCode(enrollData.totp.qr_code);
    const { data: challengeData, error: challengeError } = await supabase!.auth.mfa.challenge({ factorId: enrollData.id });
    if (challengeError || !challengeData) { setMfaError(challengeError?.message || 'Failed to challenge MFA'); setMfaLoading(false); return; }
    setMfaChallengeId(challengeData.id); setMfaLoading(false);
  }

  async function handleVerifyMfa() {
    if (!mfaCode || mfaCode.length !== 6) { setMfaError('Please enter a valid 6-digit code.'); return; }
    setMfaLoading(true); setMfaError('');
    const { error } = await supabase!.auth.mfa.verify({ factorId: mfaFactorId, challengeId: mfaChallengeId, code: mfaCode });
    setMfaLoading(false);
    if (error) { setMfaError(error.message); }
    else { setMfaStatus('enabled'); setShowMfaModal(false); }
  }

  async function handleDisableMfa() {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    const { error } = await supabase!.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaLoading(false);
    if (!error) { setMfaStatus('disabled'); setMfaFactorId(''); }
  }

  async function saveProfile() {
    if (!user?.id || !supabase) return;
    const { error } = await supabase.from('users').update({
      display_name: draft.displayName,
      username: draft.username,
      role: draft.role,
      timezone: draft.timezone,
      avatar_gradient: draft.avatarGradient,
      status: draft.status,
      profile_picture_url: draft.avatarUrl,
    }).eq('id', user.id);

    if (!error) {
      if (refresh) await refresh();
      setProfile(draft); setEditing(false); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      console.error('Failed to update profile:', error);
      showToast('Failed to update profile: ' + (error?.message || JSON.stringify(error)));
    }
  }

  function copyUsername() {
    navigator.clipboard?.writeText('@' + profile.username);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const sendSMS = async (to: string, message: string) => {
    if (!to) return;
    try {
      await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, message }) });
    } catch (err) { console.error('Failed to send SMS', err); }
  };

  const resetAddForm = () => {
    setAddStep('pick'); setAddType(null);
    setFormCard({ number: '', exp: '', cvv: '', name: '' });
    setFormUpi(''); setFormEmail(''); setFormLimit('5000'); setFormPhone('');
    setShowAddMethod(false); setAddingMethod(null); setUpiError(''); setUpiSteps([]);
    if (upgradingToPlan) {
      setCurrentPlan(upgradingToPlan as any);
      setUpgradeSuccess(true); setUpgradingToPlan(null);
      setTimeout(() => setUpgradeSuccess(false), 4000);
    }
  };

  const handleUpiVerify = () => {
    const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(formUpi)) { setUpiError('Invalid UPI ID. Format: name@bank'); return; }
    setUpiError(''); setAddStep('verifying'); setAddingMethod('upi');
    const steps: { label: string; status: 'pending' | 'active' | 'done' | 'error' }[] = [
      { label: 'Validating UPI ID', status: 'active' },
      { label: 'Contacting bank', status: 'pending' },
      { label: 'Linking account', status: 'pending' },
      { label: 'Verification complete', status: 'pending' },
    ];
    setUpiSteps(steps);
    const update = (idx: number) => setUpiSteps(prev =>
      prev.map((s, i) => i === idx ? { ...s, status: 'done' as const } : i === idx + 1 ? { ...s, status: 'active' as const } : s)
    );
    setTimeout(() => update(0), 800);
    setTimeout(() => update(1), 1800);
    setTimeout(() => update(2), 2600);
    setTimeout(() => {
      setUpiSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'done' as const } : s));
      setTimeout(() => {
        const id = `pm_${Date.now()}`;
        setPaymentMethods(prev => [...prev, { id, type: 'UPI', brand: 'upi', vpa: formUpi, isDefault: prev.length === 0 }]);
        if (formPhone) sendSMS(formPhone, `Codex Teams: Your UPI ID ${formUpi} has been successfully verified and linked.`);
        resetAddForm();
      }, 500);
    }, 3400);
  };

  const handleSubmitMethod = () => {
    if (!addType) return;
    if (addType === 'upi') { handleUpiVerify(); return; }
    setAddingMethod(addType);
    setTimeout(() => {
      const id = `pm_${Date.now()}`;
      let newMethod: any;
      if (addType === 'card') {
        const last4 = formCard.number.replace(/\s/g, '').slice(-4) || '0000';
        const brand = formCard.number.startsWith('4') ? 'visa' : 'mastercard';
        newMethod = { id, type: 'Credit Card', brand, last4, exp: formCard.exp || '01/30', isDefault: paymentMethods.length === 0, limit: parseInt(formLimit), used: 0 };
        setCardControls(prev => ({ ...prev, [id]: { online: true, intl: false, atm: true, nfc: true } }));
      } else {
        newMethod = { id, type: 'Wallet', brand: addType, email: formEmail, isDefault: paymentMethods.length === 0 };
      }
      setPaymentMethods(prev => [...prev, newMethod]);
      resetAddForm();
    }, 1500);
  };

  const handleRazorpayCheckout = async () => {
    try {
      const res = await fetch('/api/razorpay/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1, currency: 'INR' }) });
      const order = await res.json();
      if (order.error) { alert(`Error: ${order.error}`); return; }
      if (order.demo) {
        // Trigger verification for demo mode too
        await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_order_id: order.id, plan: upgradingToPlan || 'pro' })
        });
        const id = `pm_${Date.now()}`;
        setPaymentMethods(prev => [...prev, { id, type: 'Razorpay', brand: 'razorpay', paymentId: `pay_demo_${Date.now()}`, email: 'razorpay@demo', isDefault: prev.length === 0 }]);
        if (formPhone) sendSMS(formPhone, `Codex Teams: Payment checkout successful via Razorpay (Demo Mode).`);
        resetAddForm();
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX';
      const options = {
        key: keyId, amount: order.amount, currency: order.currency, name: 'Codex Teams',
        description: 'Payment Method Verification', order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, plan: upgradingToPlan || 'pro' })
            });
            const vData = await verifyRes.json();
            if (vData.status === 'ok') {
              const id = `pm_${Date.now()}`;
              setPaymentMethods(prev => [...prev, { id, type: 'Razorpay', brand: 'razorpay', paymentId: response.razorpay_payment_id, email: 'razorpay@verified', isDefault: prev.length === 0 }]);
              if (formPhone) sendSMS(formPhone, `Codex Teams: Payment verified! Subscription activated.`);
              resetAddForm();
              setTimeout(() => window.location.reload(), 1500);
            } else { alert('Verification failed: ' + vData.message); }
          } catch (e) { alert('Payment verification error.'); }
        },
        prefill: { name: 'User', email: 'user@codex-teams.com', contact: formPhone },
        theme: { color: '#7c3aed' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) { alert(`Razorpay error: ${err.message}`); }
  };

  const handleToggleControl = (cardId: string, control: string) => {
    setCardControls(prev => ({
      ...prev,
      [cardId]: { ...(prev[cardId] || { online: true, intl: false, atm: true, nfc: true }), [control]: !prev[cardId]?.[control] },
    }));
  };

  function getActivityColor(count: number) {
    if (count === 0) return '#1e2026';
    if (count < 3) return '#4c1d95';
    if (count < 6) return '#6d28d9';
    if (count < 9) return '#7c3aed';
    return '#a855f7';
  }

  const TABS: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <Edit3 size={14} /> },
    { key: 'account', label: 'Account', icon: <Shield size={14} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
    { key: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
    { key: 'privacy', label: 'Privacy', icon: <Lock size={14} /> },
    { key: 'billing', label: 'Billing', icon: <CreditCard size={14} /> },
  ];

  return (
    <div className="flex h-full bg-[#111214] text-[#e8eaf0] overflow-hidden">

      {/* ── Left panel ── */}
      <div className="w-[260px] shrink-0 border-r border-[#2a2c33] flex flex-col bg-[#0e0f11]">
        <div className="px-5 pt-7 pb-5 border-b border-[#2a2c33]">
          <div className="relative w-fit mb-4 group">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl overflow-hidden" 
              style={{ background: profile.avatarUrl ? '#111' : profile.avatarGradient }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                  <line x1="20" y1="4" x2="20" y2="36" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
                  <line x1="4" y1="20" x2="36" y2="20" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
                  <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.85)" />
                </svg>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0e0f11]" style={{ background: STATUS_CONFIG[profile.status].color }}>
              {profile.status === 'busy' && <Minus size={9} className="text-white" strokeWidth={3} />}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/0 hover:bg-black/50 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-200">
              <Camera size={18} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" 
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement('canvas');
                      const MAX_SIZE = 256;
                      let width = img.width;
                      let height = img.height;
                      if (width > height) {
                        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                      } else {
                        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                      }
                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext('2d');
                      ctx?.drawImage(img, 0, 0, width, height);
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                      setEditing(true);
                      setDraft(p => ({ ...p, avatarUrl: dataUrl }));
                    };
                    img.src = event.target?.result as string;
                  };
                  reader.readAsDataURL(f);
                }
                e.target.value = ''; // allow selecting same file again
              }}
            />
          </div>

          <p className="text-[15px] font-bold leading-tight">{profile.displayName || profile.name}</p>
          <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">@{profile.username}</p>

          <button onClick={copyUsername} className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            {copied ? <CheckCheck size={11} className="text-[#10b981]" /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy handle'}
          </button>

          <button onClick={() => setShowCard(v => !v)} className="flex items-center gap-1.5 mt-2 font-mono text-[10px] text-[#6b7280] hover:text-[#a855f7] transition-colors">
            <QrCode size={11} /> {showCard ? 'Hide ID card' : 'Show ID card'}
          </button>

          <div className="mt-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] mb-1.5">Status</p>
            <div className="grid grid-cols-2 gap-1">
              {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setProfile(p => ({ ...p, status: key }))}
                  className={['flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all', profile.status === key ? 'text-white' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'].join(' ')}
                  style={profile.status === key ? { background: cfg.bg, color: cfg.color } : {}}>
                  <div className={['w-2 h-2 rounded-full shrink-0', cfg.pulse ? 'animate-pulse' : ''].join(' ')} style={{ background: cfg.color }} />
                  <span className="text-[10.5px] truncate">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-[#2a2c33]">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#6b7280] mb-3">Your Stats</p>
          <div className="space-y-2.5">
            {[
              { label: 'Messages', val: realStats.messages.toLocaleString(), sub: 'total', icon: MessageSquare, color: '#a855f7' },
              { label: 'Channels', val: realStats.channels.toString(), sub: 'joined', icon: Hash, color: '#3b82f6' },
              { label: 'Workspaces', val: realStats.workspaces.toString(), sub: 'joined', icon: Users, color: '#10b981' },
              { label: 'Days Active', val: realStats.daysActive.toString(), sub: 'this year', icon: TrendingUp, color: '#f59e0b' },
            ].map(({ label, val, sub, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '18' }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold">{val}</p>
                  <p className="font-mono text-[9.5px] text-[#6b7280]">{label} · {sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={['w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left', activeTab === tab.key ? 'bg-[rgba(124,58,237,0.15)] text-[#c084fc]' : 'text-[#6b7280] hover:bg-[#18191d] hover:text-[#e8eaf0]'].join(' ')}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-[#2a2c33]">
          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#6b7280] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] transition-all text-left">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ════ PROFILE TAB ════ */}
        {activeTab === 'profile' && (
          <div className="max-w-[680px] mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <h2 className="text-[20px] font-bold tracking-tight">Profile</h2>
                <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">How others see you across Codex Teams</p>
              </div>
              <div className="flex items-center gap-2">
                {saved && <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#10b981] px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] rounded-lg"><Check size={11} /> Saved!</span>}
                {editing ? (
                  <>
                    <button onClick={() => { setDraft(profile); setEditing(false); }} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><X size={13} /> Cancel</button>
                    <button onClick={saveProfile} className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><Check size={13} /> Save changes</button>
                  </>
                ) : (
                  <button onClick={() => { setDraft(profile); setEditing(true); }} className="flex items-center gap-1.5 bg-[#1e2026] border border-[#2a2c33] hover:border-[#7c3aed] text-[#e8eaf0] text-[12.5px] font-semibold px-4 py-2 rounded-xl transition-all"><Edit3 size={13} /> Edit profile</button>
                )}
              </div>
            </div>

            {/* ID Card Display */}
            {showCard && (
              <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-6 mb-5" style={{ animation: 'cardSectionIn 0.35s ease' }}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-5">ID Card</p>
                <div className="flex flex-col items-center py-8 gap-5">
                  {idCardStatus === 'issued' ? (
                    <>
                      {/* ── Rendered Vertical ID Card ── */}
                      <div className="relative w-full max-w-[260px] h-[380px] flex items-center justify-center" style={{ animation: 'floatCard 8s ease-in-out infinite' }}>
                        
                        {/* Glow Behind the Glass */}
                        <div className="absolute w-[160px] h-[160px] rounded-full bg-[#7c3aed]/50 blur-[60px] -z-10 animate-pulse" style={{ animationDuration: '5s' }} />
                        <div className="absolute top-10 right-10 w-[120px] h-[120px] rounded-full bg-[#3b82f6]/40 blur-[50px] -z-10 animate-pulse" style={{ animationDuration: '7s' }} />

                        <div 
                          ref={cardRef}
                          onMouseMove={handleCardMouseMove}
                          onMouseLeave={handleCardMouseLeave}
                          className="relative w-full h-full rounded-[24px] overflow-hidden flex flex-col items-center justify-center transition-transform duration-200 ease-out will-change-transform cursor-pointer backdrop-blur-[32px] bg-clip-padding" 
                          style={{ 
                            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)', 
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 24px 48px rgba(0,0,0,0.6)',
                            transformStyle: 'preserve-3d' 
                          }}
                        >
                          {/* Glare overlay */}
                          <div 
                            ref={glareRef} 
                            className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300 opacity-0 rounded-[24px]"
                          />

                          {/* 3D Depth container */}
                          <div className="flex flex-col items-center w-full h-full pt-12 pb-6" style={{ transform: 'translateZ(40px)' }}>

                            {/* Wavy Background SVG */}
                            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none -z-10" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                              <defs>
                                <pattern id="waves" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
                                  <path d="M0 20 Q 25 40, 50 20 T 100 20" fill="none" stroke="#ffffff" strokeWidth="2" />
                                </pattern>
                              </defs>
                              <rect x="0" y="0" width="100%" height="100%" fill="url(#waves)" />
                            </svg>

                            {/* Top Lanyard Cutout & Clip - Fixed flat, no 3d transform on this element relative to the card */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center" style={{ transform: 'translateZ(-40px)' }}>
                              {/* Grey Lanyard Strap */}
                              <div className="w-8 h-16 bg-gradient-to-b from-[#6b7280] to-[#4b5563] -mt-6 rounded-full shadow-md" style={{ background: 'linear-gradient(180deg, #8c8f96 0%, #56585c 100%)' }} />
                              {/* Cutout Hole in the Card */}
                              <div className="absolute top-[-2px] w-14 h-5 bg-[#18191d] rounded-b-full shadow-[inset_0_4px_6px_rgba(0,0,0,0.6)]" />
                            </div>

                            {/* Avatar */}
                            <div className="relative z-10 w-[90px] h-[90px] mb-6 rounded-full overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.4)]" style={{ background: profile.avatarUrl ? '#111' : profile.avatarGradient }}>
                              {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-[32px] font-bold tracking-tight">
                                  {(profile.displayName || 'U').substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Name */}
                            <h3 className="relative z-10 text-[18px] font-bold text-white tracking-wide drop-shadow-md">
                              {profile.displayName}
                            </h3>

                            {/* Details */}
                            {issuedCardData && (
                              <div className="relative z-10 flex flex-col items-center mt-3 w-full px-6 opacity-90">
                                <p className="text-[11px] font-mono text-[#a855f7] uppercase tracking-[0.15em] font-bold mb-4 text-center drop-shadow-sm">
                                  {issuedCardData.designation || 'Member'}
                                </p>
                                
                                <div className="w-full space-y-2 mt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#6b7280]">DOB</span>
                                    <span className="text-[10px] font-mono text-[#e8eaf0]">{issuedCardData.dob || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#6b7280]">Email</span>
                                    <span className="text-[10px] font-mono text-[#e8eaf0] truncate max-w-[130px]">{issuedCardData.email || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#6b7280]">Mobile</span>
                                    <span className="text-[10px] font-mono text-[#e8eaf0]">{issuedCardData.mobile_number || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setShowCard(false)} className="flex items-center gap-1.5 font-mono text-[11px] bg-[#1e2026] border border-[#2a2c33] hover:border-[#33363f] text-[#6b7280] hover:text-[#e8eaf0] px-4 py-2 rounded-xl transition-all">
                          <X size={13} /> Close
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(168,85,247,0.8)" strokeWidth="1.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>

                      <div className="text-center max-w-[340px]">
                        <p className="text-[16px] font-bold text-white mb-2">ID Card Not Available</p>
                        <p className="font-mono text-[12px] text-[#6b7280] leading-relaxed">
                          Your workspace ID card hasn't been issued yet. Request one from your workspace owner to get your official Codex Teams identity card.
                        </p>
                      </div>

                      {idCardStatus === 'pending' && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)]" style={{ animation: 'fadeIn 0.3s ease' }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                          <span className="font-mono text-[11px] text-[#f59e0b]">Request sent · Awaiting approval</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {idCardStatus === 'none' && !showRequestForm ? (
                          <button onClick={() => setShowRequestForm(true)} disabled={isRequesting}
                            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                            {isRequesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                            Provide Details & Request ID
                          </button>
                        ) : idCardStatus === 'none' && showRequestForm ? (
                          <form onSubmit={handleRequestIDCard} className="w-full text-left space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">Designation</label>
                                <input required type="text" placeholder="e.g. Software Engineer"
                                  className="w-full bg-[#111214] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                                  value={requestFormData.designation} onChange={e => setRequestFormData({...requestFormData, designation: e.target.value})} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">Date of Birth</label>
                                <input required type="date"
                                  className="w-full bg-[#111214] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                                  value={requestFormData.dob} onChange={e => setRequestFormData({...requestFormData, dob: e.target.value})} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">Email</label>
                                <input required type="email" placeholder="work@example.com"
                                  className="w-full bg-[#111214] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                                  value={requestFormData.email} onChange={e => setRequestFormData({...requestFormData, email: e.target.value})} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">Mobile Number</label>
                                <input required type="tel" placeholder="+1 234 567 8900"
                                  className="w-full bg-[#111214] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                                  value={requestFormData.mobile_number} onChange={e => setRequestFormData({...requestFormData, mobile_number: e.target.value})} />
                              </div>
                              <div className="col-span-2 space-y-1.5">
                                <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1">Digital Signature (Type your full name)</label>
                                <input required type="text" placeholder="John Doe"
                                  className="w-full font-serif italic text-lg bg-[#111214] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed] transition-colors"
                                  value={requestFormData.signature} onChange={e => setRequestFormData({...requestFormData, signature: e.target.value})} />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-center pt-2">
                              <button type="button" onClick={() => setShowRequestForm(false)} disabled={isRequesting}
                                className="flex items-center gap-2 bg-[#1e2026] hover:bg-[#2a2c33] text-[#e8eaf0] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 border border-[#2a2c33]">
                                Cancel
                              </button>
                              <button type="submit" disabled={isRequesting}
                                className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                                {isRequesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                Submit Request
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={handleCancelRequest} disabled={isRequesting}
                              className="flex items-center gap-2 bg-[#1e2026] hover:bg-[#2a2c33] text-[#e8eaf0] text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 border border-[#2a2c33] hover:border-[#33363f]">
                              Cancel request
                            </button>
                            <button onClick={() => setShowCard(false)}
                              className="bg-[#1e2026] hover:bg-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all border border-[#1e2026] hover:border-[#33363f] flex items-center gap-1.5">
                              <X size={14} /> Dismiss
                            </button>
                          </div>
                        )}
                      </div>

                      {idCardStatus === 'none' && (
                        <p className="font-mono text-[10px] text-[#6b7280] text-center max-w-[300px] mt-4">
                          Workspace owners can issue ID cards from the workspace settings panel.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Avatar */}
            <Section title="Avatar">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden" 
                    style={{ background: (editing ? draft.avatarUrl : profile.avatarUrl) ? '#111' : (editing ? draft.avatarGradient : profile.avatarGradient) }}>
                    {(editing ? draft.avatarUrl : profile.avatarUrl) ? (
                      <img src={editing ? draft.avatarUrl : profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Users size={32} className="text-white opacity-40" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#18191d]" style={{ background: STATUS_CONFIG[profile.status].color }} />
                </div>
                <div className="flex-1">
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"><Upload size={12} /> Upload photo</button>
                    <button onClick={() => { setEditing(true); setDraft(p => ({ ...p, avatarUrl: '' })); }} className="bg-[#1e2026] border border-[#2a2c33] text-[#6b7280] hover:text-[#e8eaf0] text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"><Trash2 size={12} /> Remove</button>
                  </div>
                  <p className="font-mono text-[10.5px] text-[#6b7280]">JPG, PNG or GIF · Max 4MB</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2a2c33]">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-3">Avatar gradient</p>
                <div className="flex gap-2 flex-wrap">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button key={i} onClick={() => { setEditing(true); setDraft(p => ({ ...p, avatarGradient: g })); }}
                      className={['w-8 h-8 rounded-lg transition-all', (editing ? draft : profile).avatarGradient === g ? 'ring-2 ring-[#7c3aed] ring-offset-1 ring-offset-[#18191d] scale-110' : 'hover:scale-105'].join(' ')}
                      style={{ background: g }} />
                  ))}
                </div>
              </div>
            </Section>

            {/* Personal info */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Personal info</p>
              {[
                { label: 'Full Name', key: 'name', ph: 'Your legal name' },
                { label: 'Display Name', key: 'displayName', ph: 'How you appear to others' },
                { label: 'Username', key: 'username', ph: 'handle', prefix: '@' },
                { label: 'Role', key: 'role', ph: 'Frontend Engineer' },
              ].map(({ label, key, ph, prefix }) => (
                <div key={key}>
                  <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                  <div className="flex items-center">
                    {prefix && <span className="font-mono text-[13px] text-[#6b7280] bg-[#111214] border border-r-0 border-[#2a2c33] rounded-l-lg px-3 h-[38px] flex items-center">{prefix}</span>}
                    <input type="text"
                      value={(editing ? draft : profile)[key as keyof UserProfile] as string}
                      onChange={e => editing && setDraft(p => ({ ...p, [key]: e.target.value }))}
                      readOnly={!editing}
                      placeholder={ph}
                      className={['flex-1 bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[13px] px-3 outline-none transition-colors h-[38px]', prefix ? 'rounded-r-lg' : 'rounded-lg', editing ? 'focus:border-[#7c3aed] cursor-text' : 'cursor-default text-[#9ca3af]'].join(' ')} />
                  </div>
                </div>
              ))}
              <div>
                <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">Timezone</label>
                <select value={editing ? draft.timezone : profile.timezone}
                  onChange={e => editing && setDraft(p => ({ ...p, timezone: e.target.value }))}
                  disabled={!editing}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors cursor-pointer">
                  {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Social links */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Links</p>
              {[
                { label: 'Website', key: 'website', icon: <Globe size={14} className="text-[#6b7280]" />, prefix: 'https://' },
                { label: 'Twitter', key: 'twitter', icon: <Twitter size={14} className="text-[#1da1f2]" />, prefix: '@' },
                { label: 'GitHub', key: 'github', icon: <Github size={14} className="text-[#6b7280]" />, prefix: 'github.com/' },
              ].map(({ label, key, icon, prefix }) => {
                const rawVal = ((editing ? draft : profile)[key as keyof UserProfile] as string) || '';
                const displayVal = rawVal.startsWith(prefix) ? rawVal.substring(prefix.length) : rawVal;
                return (
                  <div key={key}>
                    <label className="block font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#6b7280] mb-1.5">{label}</label>
                    <div className="flex items-center border border-[#2a2c33] rounded-lg overflow-hidden bg-[#111214] focus-within:border-[#7c3aed] transition-colors">
                      <span className="flex items-center gap-2 px-3 h-[38px] border-r border-[#2a2c33] bg-[#18191d] shrink-0">
                        {icon}
                        <span className="font-mono text-[11px] text-[#6b7280]">{prefix}</span>
                      </span>
                      <input type="text" value={displayVal}
                        onChange={e => {
                          if (!editing) return;
                          const inputVal = e.target.value;
                          const savedVal = inputVal && !inputVal.startsWith(prefix) ? prefix + inputVal : inputVal || '';
                          setDraft(p => ({ ...p, [key]: savedVal }));
                        }}
                        readOnly={!editing}
                        placeholder={label.toLowerCase() + ' handle'}
                        className="flex-1 bg-transparent border-none outline-none font-mono text-[13px] text-[#e8eaf0] px-3 h-[38px] placeholder-[#33363f] cursor-text" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bio */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Bio</p>
              <textarea value={editing ? draft.bio : profile.bio} onChange={e => editing && setDraft(p => ({ ...p, bio: e.target.value }))} readOnly={!editing} rows={3} placeholder="Tell your team about yourself..."
                className={['w-full bg-[#111214] border border-[#2a2c33] text-[#e8eaf0] font-mono text-[13px] px-3 py-2.5 rounded-lg outline-none resize-none transition-colors', editing ? 'focus:border-[#7c3aed] cursor-text' : 'cursor-default text-[#9ca3af]'].join(' ')} />
            </div>

            {/* Activity heatmap */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Activity this year</p>
              <div className="flex gap-[3px] overflow-x-auto pb-1">
                {Array.from({ length: 52 }, (_, w) => (
                  <div key={w} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, d) => {
                      const cell = activityDays.find(a => a.week === w && a.day === d);
                      return <div key={d} className="w-2.5 h-2.5 rounded-[2px] hover:ring-1 hover:ring-[#7c3aed] cursor-pointer transition-all" style={{ background: getActivityColor(cell?.count ?? 0) }} title={(cell?.count ?? 0) + ' messages'} />;
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">Recent activity</p>
              <div className="space-y-3">
                {realActivity.length === 0 ? (
                  <p className="text-[12px] text-[#6b7280]">No recent activity to show.</p>
                ) : realActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[#1e2026] last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1e2026] flex items-center justify-center text-[15px] shrink-0">{a.icon}</div>
                    <div className="flex-1 min-w-0"><p className="text-[13px] truncate">{a.text}</p></div>
                    <span className="font-mono text-[10.5px] text-[#6b7280] shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ ACCOUNT TAB ════ */}
        {activeTab === 'account' && (
          <div className="max-w-[580px] mx-auto px-8 py-8">
            <div className="mb-7">
              <h2 className="text-[20px] font-bold tracking-tight">Account</h2>
              <p className="font-mono text-[11.5px] text-[#6b7280] mt-0.5">Manage your security and account settings</p>
            </div>

            <Section title="Password">
              <div className="space-y-2.5">
                <input type={showPass ? 'text' : 'password'} placeholder="Current password"
                  value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                <input type={showPass ? 'text' : 'password'} placeholder="New password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                <input type={showPass ? 'text' : 'password'} placeholder="Confirm new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[13px] px-3 h-[38px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                {passwordError && <p className="text-[#ef4444] text-[11px] font-mono">{passwordError}</p>}
                {passwordSuccess && <p className="text-[#10b981] text-[11px] font-mono">{passwordSuccess}</p>}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button onClick={() => setShowPass(v => !v)} className={['w-8 h-[18px] rounded-full transition-colors relative', showPass ? 'bg-[#7c3aed]' : 'bg-[#2a2c33]'].join(' ')}>
                      <div className={['w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-transform duration-300', showPass ? 'translate-x-[16px]' : 'translate-x-[2px]'].join(' ')} />
                    </button>
                    <span className="font-mono text-[11px] text-[#6b7280]">Show passwords</span>
                  </label>
                  <button onClick={handleUpdatePassword} disabled={passwordLoading}
                    className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#a855f7] disabled:opacity-50 text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all">
                    {passwordLoading && <Loader2 size={14} className="animate-spin" />}
                    Update password
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Two-factor authentication">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold">
                    {mfaStatus === 'loading' ? 'Loading MFA Status...' : mfaStatus === 'enabled' ? '2FA is enabled' : '2FA is disabled'}
                  </p>
                  <p className="font-mono text-[11px] text-[#6b7280] mt-0.5">
                    {mfaStatus === 'loading' ? 'Checking your security settings...' : mfaStatus === 'enabled' ? 'Your account is protected.' : 'Add an extra layer of security.'}
                  </p>
                </div>
                <button onClick={mfaStatus === 'enabled' ? handleDisableMfa : handleEnableMfa}
                  disabled={mfaStatus === 'loading' || mfaLoading}
                  className={['flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50',
                    mfaStatus === 'enabled' ? 'bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#ef4444]' : 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'].join(' ')}>
                  {mfaLoading ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
                  {mfaStatus === 'enabled' ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
              </div>

              {showMfaModal && mfaStatus !== 'enabled' && (
                <div className="mt-4 p-5 bg-[#111214] border border-[#2a2c33] rounded-xl relative" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <button onClick={() => setShowMfaModal(false)} className="absolute top-3 right-3 text-[#6b7280] hover:text-[#e8eaf0]"><X size={14} /></button>
                  <h3 className="text-[14px] font-semibold mb-2">Configure Authenticator App</h3>
                  <p className="text-[12px] text-[#9ca3af] mb-4">Scan the QR code below with your authenticator app and enter the 6-digit code to verify.</p>
                  <div className="flex flex-col items-center gap-4">
                    {mfaQrCode ? (
                      <div className="bg-white p-2 text-black rounded-lg" dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                    ) : (
                      <div className="w-[150px] h-[150px] bg-[#1a1b20] animate-pulse rounded-lg flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-[#6b7280]" />
                      </div>
                    )}
                    <div className="w-full max-w-[220px] space-y-3 mt-2">
                      <input type="text" placeholder="000 000" maxLength={6}
                        value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.4em] bg-[#1a1b20] border border-[#2a2c33] focus:border-[#7c3aed] text-[#e8eaf0] font-mono text-[16px] px-3 h-[42px] rounded-lg outline-none transition-colors placeholder-[#33363f]" />
                      {mfaError && <p className="text-[#ef4444] text-[11px] font-mono text-center">{mfaError}</p>}
                      <button onClick={handleVerifyMfa} disabled={mfaCode.length !== 6 || mfaLoading}
                        className="w-full flex justify-center items-center gap-2 bg-[#7c3aed] hover:bg-[#a855f7] text-white text-[12.5px] font-semibold h-[40px] rounded-lg transition-all disabled:opacity-50">
                        {mfaLoading && <Loader2 size={14} className="animate-spin" />} Verify and Enable
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Section>

            <div className="mt-4 bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><AlertTriangle size={15} className="text-[#ef4444]" /><p className="font-mono text-[10px] uppercase tracking-widest text-[#ef4444]">Danger zone</p></div>
              <div className="flex items-center justify-between">
                <div><p className="text-[13px] font-semibold">Delete account</p><p className="font-mono text-[11px] text-[#6b7280] mt-0.5">Permanently delete your account and all data.</p></div>
                <button className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#ef4444] text-[12.5px] font-semibold px-4 py-2 rounded-lg hover:bg-[rgba(239,68,68,0.18)] transition-all">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ NOTIFICATIONS TAB ════ */}
        {activeTab === 'notifications' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <NotificationSettings />
          </div>
        )}

        {/* ════ APPEARANCE TAB ════ */}
        {activeTab === 'appearance' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <AppearanceSettings />
          </div>
        )}

        {/* ════ PRIVACY TAB ════ */}
        {activeTab === 'privacy' && (
          <div className="max-w-[680px] mx-auto px-8 py-4">
            <PrivacySettings />
          </div>
        )}

        {/* ════ BILLING TAB ════ */}
        {activeTab === 'billing' && (
          <div className="max-w-[940px] mx-auto px-8 py-8">
            <div className="mb-6">
              <h2 className="text-[22px] font-bold tracking-tight">Billing &amp; Plans</h2>
              <p className="font-mono text-[12px] text-[#6b7280] mt-1">Manage your subscriptions and payment history</p>
            </div>

            <div className="flex gap-1 mb-8 border-b border-[#2a2c33]">
              {['Plans', 'Payment Methods'].map(t => (
                <button key={t} onClick={() => setBillingSubTab(t === 'Plans' ? 'plans' : 'methods')}
                  className={['px-5 py-2.5 font-semibold text-[13.5px] transition-all border-b-2 -mb-px', billingSubTab === (t === 'Plans' ? 'plans' : 'methods') ? 'border-white text-white' : 'border-transparent text-[#6b7280] hover:text-[#e8eaf0]'].join(' ')}>
                  {t}
                </button>
              ))}
            </div>

            {billingSubTab === 'plans' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="flex justify-end mb-8">
                  <div className="flex items-center gap-1 p-1 bg-[#18191d] border border-[#2a2c33] rounded-full">
                    <button onClick={() => setBillingCycle('monthly')} className={['px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all', billingCycle === 'monthly' ? 'bg-[#7c3aed] text-white' : 'text-[#6b7280]'].join(' ')}>Monthly</button>
                    <button onClick={() => setBillingCycle('annual')} className={['px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all', billingCycle === 'annual' ? 'bg-[#7c3aed] text-white' : 'text-[#6b7280]'].join(' ')}>Annual <span className="text-[#10b981] ml-1">-20%</span></button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-10">
                  {[
                    { key: 'free', name: 'FREE', strikePrice: null, price: '₹0', priceSub: 'Free forever', tagline: 'A simpler way to chat and collaborate', cta: 'Get started', features: ['90 days of message history', 'Up to 10 app integrations', '1:1 meetings', '1:1 external messages'] },
                    { key: 'pro', name: 'PRO', strikePrice: billingCycle === 'monthly' ? '₹600' : '₹480', price: billingCycle === 'monthly' ? '₹300' : '₹240', priceSub: 'per user/month', tagline: 'Drive productivity in one place', cta: 'Get started', features: ['Unlimited message history', 'Unlimited app integrations', 'Group meetings', 'Group external messages', 'AI conversation summaries'] },
                    { key: 'business', name: 'BUSINESS+', strikePrice: billingCycle === 'monthly' ? '₹1,400' : '₹1,120', price: billingCycle === 'monthly' ? '₹700' : '₹560', priceSub: 'per user/month', tagline: 'Scale with AI-powered work', cta: 'Get started', popular: true, features: ['Everything in Pro', 'Slackbot personal AI agent', 'AI workflow generation', 'AI search & daily recaps', 'SAML-based SSO', 'SCIM user management'] },
                    { key: 'enterprise', name: 'ENTERPRISE+', strikePrice: null, price: null, priceSub: 'Contact sales for pricing', tagline: 'Maximise performance on the most comprehensive platform', cta: 'Contact sales', features: ['Everything in Business+', 'Enterprise search', 'Multiple SAML configurations', 'EMM integration support', 'Native data loss prevention'] },
                  ].map(plan => (
                    <div key={plan.key} className={['relative p-5 rounded-2xl border transition-all flex flex-col', currentPlan === plan.key ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.08)]' : 'border-[#2a2c33] bg-[#18191d]'].join(' ')}>
                      {(plan as any).popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#7c3aed] text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-xl flex items-center gap-1">
                          <Sparkles size={9} /> Popular
                        </div>
                      )}
                      <p className="font-mono text-[10.5px] font-bold text-[#6b7280] mb-1">{plan.name}</p>
                      <p className="text-[11px] text-[#6b7280] leading-relaxed mb-3 min-h-[32px]">{plan.tagline}</p>
                      <div className="mb-1 min-h-[40px]">
                        {plan.price ? (
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {plan.strikePrice && <span className="font-mono text-[13px] text-[#33363f] line-through">{plan.strikePrice}</span>}
                            <span className="text-[26px] font-extrabold text-white">{plan.price}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1"><Users size={14} className="text-[#a855f7]" /><span className="text-[13px] font-bold text-[#9ca3af]">Custom pricing</span></div>
                        )}
                      </div>
                      <p className="font-mono text-[9.5px] text-[#33363f] mb-5">{plan.priceSub}</p>
                      <button onClick={() => {
                        if (currentPlan === plan.key) return;
                        if (plan.key === 'free') { setCurrentPlan('free'); return; }
                        if (plan.key === 'enterprise') { window.open('mailto:sales@codexteams.dev?subject=Enterprise+Plan+Inquiry', '_blank'); return; }
                        setUpgradingToPlan(plan.key); setBillingSubTab('methods'); setShowAddMethod(true);
                      }}
                        className={['w-full py-2.5 rounded-xl font-bold text-[13px] transition-all mb-5',
                          currentPlan === plan.key ? 'bg-[#7c3aed] text-white' : (plan as any).popular ? 'bg-[#7c3aed] hover:bg-[#a855f7] text-white' : 'border border-[#33363f] text-[#e8eaf0] hover:border-[#7c3aed]'].join(' ')}>
                        {currentPlan === plan.key ? <><Check size={14} className="inline mr-1" /> Current Plan</> : plan.cta}
                      </button>
                      <div className="space-y-2.5 flex-1">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-start gap-2">
                            <Check size={13} className="text-[#7c3aed] shrink-0 mt-0.5" />
                            <span className="text-[11px] text-[#9ca3af] leading-snug">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature comparison table */}
                <div className="border border-[#2a2c33] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-5 border-b border-[#2a2c33] bg-[#111214]">
                    <div className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Features</div>
                    {['Free', 'Pro', 'Business+', 'Enterprise+'].map(n => (
                      <div key={n} className="px-5 py-3 font-mono text-[11px] font-bold text-[#9ca3af] border-l border-[#2a2c33]">{n}</div>
                    ))}
                  </div>
                  {[
                    { feature: 'Message history', free: '90 days', pro: true, biz: true, ent: true },
                    { feature: 'App integrations', free: 'Up to 10', pro: true, biz: true, ent: true },
                    { feature: '1:1 meetings', free: true, pro: true, biz: true, ent: true },
                    { feature: '1:1 external messages', free: true, pro: true, biz: true, ent: true },
                    { feature: 'Group meetings', free: false, pro: true, biz: true, ent: true },
                    { feature: 'Group external messages', free: false, pro: true, biz: true, ent: true },
                    { section: 'AI Features' },
                    { feature: 'AI conversation summaries', free: false, pro: true, biz: true, ent: true },
                    { feature: 'Slackbot (personal AI)', free: false, pro: false, biz: true, ent: true, badge: 'NEW' },
                    { feature: 'AI workflow generation', free: false, pro: false, biz: true, ent: true },
                    { feature: 'AI search', free: false, pro: false, biz: true, ent: true },
                    { feature: 'AI daily recaps', free: false, pro: false, biz: true, ent: true },
                    { section: 'Security & Compliance' },
                    { feature: 'SAML-based single sign-on', free: false, pro: false, biz: true, ent: true },
                    { feature: 'SCIM user management', free: false, pro: false, biz: true, ent: true },
                    { feature: 'EMM integration support', free: false, pro: false, biz: false, ent: true },
                    { feature: 'Native data loss prevention', free: false, pro: false, biz: false, ent: true },
                    { feature: 'Multiple SAML configs', free: false, pro: false, biz: false, ent: true },
                  ].map((row: any, idx) => {
                    if (row.section) {
                      return (
                        <div key={row.section} className="grid grid-cols-5 border-t border-[#2a2c33] bg-[#111214]">
                          <div className="px-5 py-2.5 col-span-5 flex items-center gap-2">
                            <Sparkles size={11} className="text-[#a855f7]" />
                            <p className="font-mono text-[10.5px] font-bold text-[#a855f7] uppercase tracking-widest">{row.section}</p>
                          </div>
                        </div>
                      );
                    }
                    const renderCell = (val: boolean | string) => {
                      if (val === true) return <Check size={14} className="text-[#7c3aed]" />;
                      if (val === false) return <Minus size={14} className="text-[#2a2c33]" />;
                      return <span className="font-mono text-[11px] text-[#9ca3af]">{val}</span>;
                    };
                    return (
                      <div key={row.feature} className={['grid grid-cols-5 border-t border-[#1e2026] transition-colors', idx % 2 === 0 ? 'bg-[#18191d]' : 'bg-[#111214]'].join(' ')}>
                        <div className="px-5 py-3 flex items-center gap-2">
                          <p className="text-[12px] text-[#9ca3af]">{row.feature}</p>
                          {row.badge && <span className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10b981] border border-[rgba(16,185,129,0.3)]">{row.badge}</span>}
                        </div>
                        {[row.free, row.pro, row.biz, row.ent].map((val: any, ci: number) => (
                          <div key={ci} className="px-5 py-3 flex items-center border-l border-[#1e2026]">{renderCell(val)}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <p className="font-mono text-[10.5px] text-[#33363f] mt-4">*Terms apply. Prices shown in INR. All plans include end-to-end encryption and 99.9% uptime SLA.</p>
              </div>
            )}

            {billingSubTab === 'methods' && (
              <div className="max-w-[640px] mx-auto space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-bold">Saved Payment Methods</h3>
                  <button onClick={() => { setShowAddMethod(!showAddMethod); if (showAddMethod) resetAddForm(); }}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all active:scale-95">
                    <Plus size={14} /> Add Method
                  </button>
                </div>

                {upgradingToPlan && (
                  <div className="p-5 bg-gradient-to-r from-[rgba(124,58,237,0.15)] to-[rgba(168,85,247,0.08)] border border-[rgba(124,58,237,0.3)] rounded-2xl flex items-center justify-between" style={{ animation: 'cardSectionIn 0.3s ease' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shadow-lg"><ArrowRight size={18} className="text-white" /></div>
                      <div>
                        <p className="text-[13px] font-bold text-white">Upgrading to <span className="text-[#c084fc] uppercase">{upgradingToPlan}</span></p>
                        <p className="text-[11px] text-[#6b7280]">Add a payment method below to confirm your upgrade</p>
                      </div>
                    </div>
                    <button onClick={() => { setUpgradingToPlan(null); setBillingSubTab('plans'); }} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest font-bold">Cancel</button>
                  </div>
                )}

                {upgradeSuccess && (
                  <div className="p-4 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-2xl flex items-center gap-3" style={{ animation: 'cardSectionIn 0.3s ease' }}>
                    <CheckCircle2 size={20} className="text-[#10b981] shrink-0" />
                    <div>
                      <p className="text-[13px] font-bold text-[#10b981]">Plan upgraded successfully!</p>
                      <p className="text-[11px] text-[#6b7280]">Your new plan is now active. Enjoy the premium features.</p>
                    </div>
                  </div>
                )}

                {showAddMethod && (
                  <div className="p-6 bg-[#18191d] border border-[#7c3aed] rounded-2xl space-y-4" style={{ animation: 'cardSectionIn 0.25s ease' }}>
                    {addStep === 'pick' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Select Payment Type</p>
                          <button onClick={resetAddForm} className="text-[#6b7280] hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {([
                            { type: 'card' as const, label: 'Credit Card', icon: <CreditCard size={20} /> },
                            { type: 'upi' as const, label: 'UPI', icon: <span className="font-black text-[14px]">UPI</span> },
                            { type: 'paypal' as const, label: 'PayPal', icon: <span className="font-black italic text-[12px]">PayPal</span> },
                            { type: 'gpay' as const, label: 'Google Pay', icon: <span className="font-black text-[12px]">GPay</span> },
                          ]).map(item => (
                            <button key={item.type} onClick={() => { setAddType(item.type); setAddStep('form'); }}
                              className="flex flex-col items-center gap-3 p-4 bg-[#0e0f11] border border-[#2a2c33] rounded-xl hover:border-[#7c3aed] hover:bg-[#1c142e] transition-all group">
                              <div className="text-[#6b7280] group-hover:text-[#7c3aed] transition-colors">{item.icon}</div>
                              <span className="text-[10px] uppercase tracking-widest font-bold text-[#6b7280] group-hover:text-white">{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {addStep === 'form' && addType === 'card' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Enter Card Details</p>
                          <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Cardholder Name</label>
                            <input value={formCard.name} onChange={e => setFormCard(p => ({ ...p, name: e.target.value }))} placeholder="John Doe"
                              className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Card Number</label>
                            <input value={formCard.number} onChange={e => setFormCard(p => ({ ...p, number: e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim() }))} placeholder="4242 4242 4242 4242" maxLength={19}
                              className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none tracking-wider transition-colors" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Expiry</label>
                              <input value={formCard.exp} onChange={e => setFormCard(p => ({ ...p, exp: e.target.value }))} placeholder="MM/YY" maxLength={5}
                                className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">CVV</label>
                              <input value={formCard.cvv} onChange={e => setFormCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))} placeholder="•••" maxLength={4} type="password"
                                className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Credit Limit</label>
                              <input value={formLimit} onChange={e => setFormLimit(e.target.value.replace(/\D/g, ''))} placeholder="5000"
                                className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                            </div>
                          </div>
                        </div>
                        <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formCard.number || !formCard.exp || !formCard.name}
                          className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          {addingMethod ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : 'Add Card'}
                        </button>
                      </>
                    )}

                    {addStep === 'form' && addType === 'upi' && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Enter UPI ID</p>
                          <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                        </div>
                        <div className="relative">
                          <input value={formUpi} onChange={e => { setFormUpi(e.target.value); setUpiError(''); }} placeholder="yourname@okaxis"
                            className={`w-full px-3 py-2.5 bg-[#0e0f11] border rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] outline-none transition-colors ${upiError ? 'border-[#ef4444]' : 'border-[#2a2c33] focus:border-[#7c3aed]'}`} />
                          {formUpi && /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/.test(formUpi) && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10b981]" />}
                        </div>
                        {upiError && <div className="flex items-center gap-2 text-[#ef4444] text-[11px]"><XCircle size={12} /> {upiError}</div>}
                        <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone for SMS receipt (+91...)"
                          className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                        <p className="text-[10px] text-[#6b7280]">Supported: @okaxis, @okhdfcbank, @oksbi, @paytm, @ybl, @ibl</p>
                        <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formUpi}
                          className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          Verify &amp; Link UPI
                        </button>
                      </>
                    )}

                    {addStep === 'verifying' && addType === 'upi' && (
                      <div className="space-y-3">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Verifying UPI: {formUpi}</p>
                        {upiSteps.map((step, i) => (
                          <div key={i} className="flex items-center gap-3 py-1.5">
                            {step.status === 'done' && <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />}
                            {step.status === 'active' && <Loader2 size={16} className="text-[#7c3aed] animate-spin shrink-0" />}
                            {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-[#2a2c33] shrink-0" />}
                            <span className={`text-[12px] ${step.status === 'done' ? 'text-[#10b981]' : step.status === 'active' ? 'text-white' : 'text-[#6b7280]'}`}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {addStep === 'form' && (addType === 'paypal' || addType === 'gpay') && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Enter {addType === 'gpay' ? 'Google Pay' : 'PayPal'} Email</p>
                          <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                        </div>
                        <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder={addType === 'gpay' ? 'you@gmail.com' : 'you@paypal.com'} type="email"
                          className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors" />
                        <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formEmail}
                          className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                          {addingMethod ? <><Loader2 size={14} className="animate-spin" /> Connecting...</> : `Link ${addType === 'gpay' ? 'Google Pay' : 'PayPal'}`}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {paymentMethods.length === 0 && !showAddMethod && (
                  <div className="text-center py-16 text-[#6b7280]">
                    <CreditCard size={36} className="mx-auto mb-4 opacity-30" />
                    <p className="text-[14px] font-semibold mb-1">No payment methods added yet</p>
                    <p className="text-[11px]">Click "Add Method" above to get started</p>
                  </div>
                )}

                <div className="space-y-3">
                  {paymentMethods.map(pm => {
                    const isExpanded = expandedCardId === pm.id;
                    const controls = cardControls[pm.id] || { online: true, intl: false, atm: true, nfc: true };
                    const pctUsed = pm.type === 'Credit Card' && pm.limit > 0 ? ((pm.used / pm.limit) * 100).toFixed(0) : 0;

                    return (
                      <div key={pm.id} className="bg-[#18191d] border border-[#2a2c33] rounded-2xl overflow-hidden transition-all group">
                        <div onClick={() => pm.type === 'Credit Card' && setExpandedCardId(isExpanded ? null : pm.id)}
                          className={['flex items-center justify-between p-5 transition-all', pm.type === 'Credit Card' ? 'cursor-pointer hover:bg-[#1c1d21]' : ''].join(' ')}>
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-9 bg-white rounded flex items-center justify-center text-[#111214] font-black italic text-[12px] shadow-sm px-1">
                              {pm.brand === 'visa' && 'VISA'}
                              {pm.brand === 'mastercard' && 'MC'}
                              {pm.brand === 'upi' && <span className="text-[#006039]">UPI</span>}
                              {pm.brand === 'paypal' && <span className="text-[#003087] text-[10px]">PayPal</span>}
                              {pm.brand === 'gpay' && <span className="text-[#4285F4] text-[10px]">GPay</span>}
                              {pm.brand === 'razorpay' && <span className="text-[#0EA5E9] text-[8px]">RZP</span>}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="text-[13.5px] font-bold text-white">
                                  {pm.type === 'Credit Card'
                                    ? <span className="flex items-center gap-3"><span className="tracking-widest opacity-50">•••• ••••</span><span>{pm.last4}</span></span>
                                    : (pm.vpa || pm.email)}
                                </p>
                                {pm.isDefault && <span className="text-[9px] bg-[rgba(124,58,237,0.15)] text-[#c084fc] px-2 py-0.5 rounded-md border border-[rgba(124,58,237,0.3)] uppercase tracking-widest">Default</span>}
                              </div>
                              <p className="font-mono text-[11px] text-[#6b7280]">{pm.type === 'Credit Card' ? `Expires ${pm.exp}` : pm.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {pm.type === 'Credit Card' && (
                              <div className="text-[#6b7280] p-2 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                                <ChevronDown size={16} />
                              </div>
                            )}
                            {!pm.isDefault && (
                              <button onClick={e => { e.stopPropagation(); setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === pm.id }))); }}
                                className="p-2 text-[#6b7280] hover:text-[#c084fc] hover:bg-[#2a2c33] rounded-lg transition-all" title="Set as default">
                                <Star size={16} />
                              </button>
                            )}
                            <button onClick={e => { e.stopPropagation(); setPaymentMethods(prev => prev.filter(m => m.id !== pm.id)); }}
                              className="p-2 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#2a2c33] rounded-lg transition-all" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && pm.type === 'Credit Card' && (
                          <div className="border-t border-[#2a2c33] bg-[#121316] p-6 space-y-5" style={{ animation: 'cardSectionIn 0.25s ease' }}>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-mono text-[#6b7280] uppercase tracking-widest">Credit Usage</span>
                                <span className="text-[12px] font-bold text-white">₹{pm.used.toLocaleString()} <span className="text-[#6b7280] font-normal">/ ₹{pm.limit.toLocaleString()}</span></span>
                              </div>
                              <div className="h-2 w-full bg-[#1e2026] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full transition-all duration-1000" style={{ width: `${pctUsed}%` }} />
                              </div>
                              <div className="flex justify-between mt-1 text-[10px] text-[#6b7280] font-mono">
                                <span>{pctUsed}% Used</span>
                                <span>Available: ₹{(pm.limit - pm.used).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <div className="space-y-2">
                                <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest mb-3">Billing &amp; Services</p>
                                {[
                                  { icon: FileText, label: 'Statements', desc: 'View recent statements' },
                                  { icon: PieChart, label: 'EMI Offers', desc: 'Convert to EMI' },
                                  { icon: Percent, label: 'Interest & Charges', desc: 'View rates' },
                                ].map(item => (
                                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1e2026] border border-transparent hover:border-[#2a2c33] transition-all cursor-pointer group/link">
                                    <div className="w-8 h-8 rounded-lg bg-[#18191d] border border-[#2a2c33] flex items-center justify-center text-[#6b7280] group-hover/link:text-[#7c3aed] transition-colors">
                                      <item.icon size={14} />
                                    </div>
                                    <div>
                                      <p className="text-[12px] font-bold text-[#e8eaf0]">{item.label}</p>
                                      <p className="text-[10px] text-[#6b7280]">{item.desc}</p>
                                    </div>
                                    <ChevronRight size={14} className="ml-auto text-[#6b7280] opacity-0 group-hover/link:opacity-100 transition-all" />
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-2">
                                <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest mb-3">Security &amp; Controls</p>
                                <div className="bg-[#18191d] border border-[#2a2c33] rounded-xl p-1">
                                  {[
                                    { key: 'online', label: 'Online Transactions', icon: Globe },
                                    { key: 'intl', label: 'International Usage', icon: Smartphone },
                                    { key: 'atm', label: 'ATM Withdrawals', icon: Landmark },
                                    { key: 'nfc', label: 'Tap & Pay (NFC)', icon: ShieldAlert },
                                  ].map((ctrl, i) => (
                                    <div key={ctrl.key} className={`flex items-center justify-between p-3 ${i !== 3 ? 'border-b border-[#2a2c33]' : ''}`}>
                                      <div className="flex items-center gap-3 text-[#6b7280]">
                                        <ctrl.icon size={14} className={(controls as any)[ctrl.key] ? 'text-[#10b981]' : ''} />
                                        <span className="text-[12px] font-medium text-[#e8eaf0]">{ctrl.label}</span>
                                      </div>
                                      <button onClick={e => { e.stopPropagation(); handleToggleControl(pm.id, ctrl.key); }}
                                        className={`w-8 h-[18px] rounded-full transition-colors relative ${(controls as any)[ctrl.key] ? 'bg-[#10b981]' : 'bg-[#2a2c33]'}`}>
                                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-transform duration-300 ${(controls as any)[ctrl.key] ? 'translate-x-[16px]' : 'translate-x-[2px]'}`} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Razorpay Checkout */}
                <div className="mt-6 pt-6 border-t border-[#2a2c33]">
                  <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#0EA5E9]" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Razorpay Checkout</p>
                    </div>
                    <p className="text-[12px] text-[#6b7280]">Verify your identity and add a payment method instantly through Razorpay's secure checkout.</p>
                    <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone number for SMS receipt (e.g. +919876543210)"
                      className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#0EA5E9] outline-none transition-colors" />
                    <button onClick={handleRazorpayCheckout} disabled={!formPhone}
                      className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white text-[12px] uppercase tracking-widest font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
                      <Zap size={16} /> Pay with Razorpay
                    </button>
                    <p className="text-center text-[10px] text-[#33363f]">Secure payment via Razorpay • SMS confirmation sent on success</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local Toast UI */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#7c3aed] text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-[#a855f7] animate-in fade-in slide-in-from-bottom-4">
          <Check size={16} />
          <p className="font-mono text-[12px] font-semibold tracking-wide">{toastMsg}</p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn        { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes cardSectionIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes floatCard     {
          0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
          50%      { transform: translateY(-10px) rotateX(2deg) rotateY(-2deg); }
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 mb-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#6b7280] mb-4">{title}</p>
      {children}
    </div>
  );
}

export default ProfilePage;