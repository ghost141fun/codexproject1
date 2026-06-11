'use client';

import { useState } from 'react';
import {
  Check, X, Users, Zap, ArrowRight, Plus, Minus,
  CreditCard, Loader2, Landmark, CheckCircle2, XCircle,
  ChevronDown, FileText, PieChart, Percent, ShieldAlert,
  Globe, Smartphone, Sparkles, Star, Trash2, ChevronRight,
  MessageSquare, Mail, Phone, Info
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type BillingSubTab = 'plans' | 'methods';

interface BillingProps {
  user: any;
}

export function Billing({ user }: BillingProps) {
  // ── Billing state ────────────────────────────────────────────────────────────
  const [currentPlan,   setCurrentPlan]   = useState<'free'|'pro'|'business'|'enterprise'>('free');
  const [billingCycle,  setBillingCycle]  = useState<'monthly'|'annual'>('monthly');
  const [billingSubTab, setBillingSubTab] = useState<BillingSubTab>('plans');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [cardControls, setCardControls] = useState<Record<string, Record<string, boolean>>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [addStep, setAddStep] = useState<'pick'|'form'|'verifying'>('pick');
  const [addType, setAddType] = useState<'card'|'upi'|'paypal'|'gpay'|null>(null);
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  
  // Form fields
  const [formCard, setFormCard] = useState({ number: '', exp: '', cvv: '', name: '' });
  const [formUpi, setFormUpi] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLimit, setFormLimit] = useState('5000');
  const [upiError, setUpiError] = useState('');
  const [upiSteps, setUpiSteps] = useState<{label: string; status: 'pending'|'active'|'done'|'error'}[]>([]);
  
  const [upgradingToPlan, setUpgradingToPlan] = useState<string|null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  // ── Contact Sales state ──────────────────────────────────────────────────────
  const [showContactSales, setShowContactSales] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.display_name || '',
    email: user?.email || '',
    phone: '',
    description: ''
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const sendSMS = async (to: string, message: string) => {
    if (!to) return;
    try {
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
    } catch (err) { console.error('Failed to send SMS', err); }
  };

  const resetAddForm = () => {
    setAddStep('pick');
    setAddType(null);
    setFormCard({ number: '', exp: '', cvv: '', name: '' });
    setFormUpi('');
    setFormEmail('');
    setFormLimit('5000');
    setFormPhone('');
    setShowAddMethod(false);
    setAddingMethod(null);
    setUpiError('');
    setUpiSteps([]);

    // If we were upgrading, confirm the plan change
    if (upgradingToPlan) {
      setCurrentPlan(upgradingToPlan as any);
      setUpgradeSuccess(true);
      setUpgradingToPlan(null);
      setTimeout(() => setUpgradeSuccess(false), 4000);
    }
  };

  const handleUpiVerify = () => {
    const upiRegex = /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(formUpi)) {
      setUpiError('Invalid UPI ID. Format: name@bank');
      return;
    }
    setUpiError('');
    setAddStep('verifying');
    setAddingMethod('upi');

    const steps: {label: string; status: 'pending'|'active'|'done'|'error'}[] = [
      { label: 'Validating UPI ID', status: 'active' },
      { label: 'Contacting bank', status: 'pending' },
      { label: 'Linking account', status: 'pending' },
      { label: 'Verification complete', status: 'pending' },
    ];
    setUpiSteps(steps);

    const update = (idx: number) => {
      setUpiSteps(prev => prev.map((s, i) =>
        i === idx ? { ...s, status: 'done' as const } : i === idx + 1 ? { ...s, status: 'active' as const } : s
      ));
    };

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
      } else if (addType === 'paypal' || addType === 'gpay') {
        newMethod = { id, type: 'Wallet', brand: addType, email: formEmail, isDefault: paymentMethods.length === 0 };
      }
      setPaymentMethods(prev => [...prev, newMethod]);
      resetAddForm();
    }, 1500);
  };

  const handleRazorpayCheckout = async () => {
    try {
      // Prices mapping
      const PLAN_PRICES = {
        pro: { monthly: 300, annual: 240 },
        business: { monthly: 700, annual: 560 },
      };

      // Get the correct price based on the plan being upgraded to
      let amount = 1; // Fallback/Verification amount
      if (upgradingToPlan && (upgradingToPlan === 'pro' || upgradingToPlan === 'business')) {
        amount = (PLAN_PRICES as any)[upgradingToPlan][billingCycle];
      }

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR' }),
      });
      const order = await res.json();
      if (order.error) { alert(`Error: ${order.error}`); return; }
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX';
      const options = {
        key: keyId, amount: order.amount, currency: order.currency, name: 'Codex Teams',
        description: upgradingToPlan ? `Upgrade to ${upgradingToPlan.toUpperCase()}` : 'Payment Method Verification',
        order_id: order.id,
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
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) { alert(`Razorpay error: ${err.message}`); }
  };

  const handleToggleControl = (cardId: string, control: string) => {
    setCardControls(prev => ({
      ...prev,
      [cardId]: { ...(prev[cardId] || { online: true, intl: false, atm: true, nfc: true }), [control]: !prev[cardId]?.[control] }
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingContact(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmittingContact(false);
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        setShowContactSales(false);
        setContactForm({ ...contactForm, description: '' });
      }, 3000);
    }, 1500);
  };

  return (
    <div className="max-w-[940px] mx-auto px-8 py-8">
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-tight">Billing & Plans</h2>
        <p className="font-mono text-[12px] text-[#6b7280] mt-1">Manage your subscriptions and payment history</p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-[#2a2c33]">
        {['Plans', 'Payment Methods'].map((t) => (
          <button key={t} onClick={() => setBillingSubTab(t.toLowerCase() === 'plans' ? 'plans' : 'methods')}
            className={['px-5 py-2.5 font-semibold text-[13.5px] transition-all border-b-2 -mb-px', billingSubTab === (t.toLowerCase() === 'plans' ? 'plans' : 'methods') ? 'border-white text-white' : 'border-transparent text-[#6b7280] hover:text-[#e8eaf0]'].join(' ')}>
            {t}
          </button>
        ))}
      </div>

      {billingSubTab === 'plans' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="flex justify-end mb-8">
            <div className="flex items-center gap-1 p-1 bg-[#18191d] border border-[#2a2c33] rounded-full">
              <button onClick={() => setBillingCycle('monthly')} className={['px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all', billingCycle==='monthly' ? 'bg-[#7c3aed] text-white' : 'text-[#6b7280]'].join(' ')}>Monthly</button>
              <button onClick={() => setBillingCycle('annual')} className={['px-5 py-1.5 rounded-full text-[13px] font-semibold transition-all', billingCycle==='annual' ? 'bg-[#7c3aed] text-white' : 'text-[#6b7280]'].join(' ')}>Annual <span className="text-[#10b981] ml-1">-20%</span></button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              {
                key:'free', name:'FREE', strikePrice:null,
                price:'₹0', priceSub:'Free forever',
                tagline:'A simpler way to chat and collaborate',
                cta:'Get started',
                features:['90 days of message history','Up to 10 app integrations','1:1 meetings','1:1 external messages'],
              },
              {
                key:'pro', name:'PRO',
                strikePrice: billingCycle==='monthly' ? '₹600' : '₹480',
                price: billingCycle==='monthly' ? '₹300' : '₹240',
                priceSub:'per user/month',
                tagline:'Drive productivity in one place',
                cta:'Get started',
                features:['Unlimited message history','Unlimited app integrations','Group meetings','Group external messages','AI conversation summaries'],
              },
              {
                key:'business', name:'BUSINESS+',
                strikePrice: billingCycle==='monthly' ? '₹1,400' : '₹1,120',
                price: billingCycle==='monthly' ? '₹700' : '₹560',
                priceSub:'per user/month',
                tagline:'Scale with AI-powered work',
                cta:'Get started', popular:true,
                features:['Everything in Pro','Slackbot personal AI agent','AI workflow generation','AI search & daily recaps','SAML-based SSO','SCIM user management'],
              },
              {
                key:'enterprise', name:'ENTERPRISE+', strikePrice:null,
                price:null, priceSub:'Contact sales for pricing',
                tagline:'Maximise performance on the most comprehensive platform',
                cta:'Contact sales',
                features:['Everything in Business+','Enterprise search','Multiple SAML configurations','EMM integration support','Native data loss prevention'],
              },
            ].map(plan => (
              <div key={plan.key} className={['relative p-5 rounded-2xl border transition-all flex flex-col', currentPlan===plan.key ? 'border-[#7c3aed] bg-[rgba(124,58,237,0.08)]' : 'border-[#2a2c33] bg-[#18191d]'].join(' ')}>
                {(plan as any).popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#7c3aed] text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-xl flex items-center gap-1">
                    <Sparkles size={9}/> Popular
                  </div>
                )}

                <p className="font-mono text-[10.5px] font-bold text-[#6b7280] mb-1">{plan.name}</p>
                <p className="text-[11px] text-[#6b7280] leading-relaxed mb-3 min-h-[32px]">{plan.tagline}</p>

                {/* Price */}
                <div className="mb-1 min-h-[40px]">
                  {plan.price ? (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {plan.strikePrice && (
                        <span className="font-mono text-[13px] text-[#33363f] line-through">{plan.strikePrice}</span>
                      )}
                      <span className="text-[26px] font-extrabold text-white">{plan.price}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Users size={14} className="text-[#a855f7]"/>
                      <span className="text-[13px] font-bold text-[#9ca3af]">Custom pricing</span>
                    </div>
                  )}
                </div>
                <p className="font-mono text-[9.5px] text-[#33363f] mb-5">{plan.priceSub}</p>

                {/* CTA */}
                <button onClick={() => {
                    if (currentPlan === plan.key) return;
                    if (plan.key === 'free') { setCurrentPlan('free'); return; }
                    if (plan.key === 'enterprise') { setShowContactSales(true); return; }
                    setUpgradingToPlan(plan.key);
                    setBillingSubTab('methods');
                    setShowAddMethod(true);
                  }}
                  className={['w-full py-2.5 rounded-xl font-bold text-[13px] transition-all mb-5',
                    currentPlan===plan.key
                      ? 'bg-[#7c3aed] text-white'
                      : (plan as any).popular
                        ? 'bg-[#7c3aed] hover:bg-[#a855f7] text-white'
                        : 'border border-[#33363f] text-[#e8eaf0] hover:border-[#7c3aed]'
                  ].join(' ')}>
                  {currentPlan===plan.key ? <><Check size={14} className="inline mr-1"/> Current Plan</> : plan.cta}
                </button>

                {/* Feature list */}
                <div className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={13} className="text-[#7c3aed] shrink-0 mt-0.5"/>
                      <span className="text-[11px] text-[#9ca3af] leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Feature comparison table ── */}
          <div className="border border-[#2a2c33] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 border-b border-[#2a2c33] bg-[#111214]">
              <div className="px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#6b7280]">Features</div>
              {['Free','Pro','Business+','Enterprise+'].map(n => (
                <div key={n} className="px-5 py-3 font-mono text-[11px] font-bold text-[#9ca3af] border-l border-[#2a2c33]">{n}</div>
              ))}
            </div>

            {/* Feature rows */}
            {[
              { feature:'Message history',          free:'90 days',  pro:true,  biz:true,  ent:true  },
              { feature:'App integrations',          free:'Up to 10', pro:true,  biz:true,  ent:true  },
              { feature:'1:1 meetings',              free:true,       pro:true,  biz:true,  ent:true  },
              { feature:'1:1 external messages',     free:true,       pro:true,  biz:true,  ent:true  },
              { feature:'Group meetings',            free:false,      pro:true,  biz:true,  ent:true  },
              { feature:'Group external messages',   free:false,      pro:true,  biz:true,  ent:true  },
              { section: 'AI Features' },
              { feature:'AI conversation summaries', free:false,      pro:true,  biz:true,  ent:true  },
              { feature:'Slackbot (personal AI)',    free:false,      pro:false, biz:true,  ent:true, badge:'NEW' },
              { feature:'AI workflow generation',    free:false,      pro:false, biz:true,  ent:true  },
              { feature:'AI search',                 free:false,      pro:false, biz:true,  ent:true  },
              { feature:'AI daily recaps',           free:false,      pro:false, biz:true,  ent:true  },
              { feature:'AI file summaries',         free:false,      pro:false, biz:true,  ent:true  },
              { section: 'Security & Compliance' },
              { feature:'SAML-based single sign-on', free:false,      pro:false, biz:true,  ent:true  },
              { feature:'SCIM user management',      free:false,      pro:false, biz:true,  ent:true  },
              { feature:'EMM integration support',   free:false,      pro:false, biz:false, ent:true  },
              { feature:'Native data loss prevention',free:false,     pro:false, biz:false, ent:true  },
              { feature:'Multiple SAML configs',     free:false,      pro:false, biz:false, ent:true  },
            ].map((row: any, idx) => {
              if (row.section) {
                return (
                  <div key={row.section} className="grid grid-cols-5 border-t border-[#2a2c33] bg-[#111214]">
                    <div className="px-5 py-2.5 col-span-5 flex items-center gap-2">
                      <Sparkles size={11} className="text-[#a855f7]"/>
                      <p className="font-mono text-[10.5px] font-bold text-[#a855f7] uppercase tracking-widest">{row.section}</p>
                    </div>
                  </div>
                );
              }

              const renderCell = (val: boolean | string) => {
                if (val === true) return <Check size={14} className="text-[#7c3aed]"/>;
                if (val === false) return <Minus size={14} className="text-[#2a2c33]"/>;
                return <span className="font-mono text-[11px] text-[#9ca3af]">{val}</span>;
              };

              return (
                <div key={row.feature} className={['grid grid-cols-5 border-t border-[#1e2026] transition-colors', idx % 2 === 0 ? 'bg-[#18191d]' : 'bg-[#111214]'].join(' ')}>
                  <div className="px-5 py-3 flex items-center gap-2">
                    <p className="text-[12px] text-[#9ca3af]">{row.feature}</p>
                    {row.badge && (
                      <span className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10b981] border border-[rgba(16,185,129,0.3)]">{row.badge}</span>
                    )}
                  </div>
                  {[row.free, row.pro, row.biz, row.ent].map((val: any, ci: number) => (
                    <div key={ci} className="px-5 py-3 flex items-center border-l border-[#1e2026]">
                      {renderCell(val)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <p className="font-mono text-[10.5px] text-[#33363f] mt-4">
            *Terms apply. Prices shown in INR. All plans include end-to-end encryption and 99.9% uptime SLA.
          </p>
        </div>
      )}

      {billingSubTab === 'methods' && (
        <div className="max-w-[640px] mx-auto space-y-4" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[16px] font-bold">Saved Payment Methods</h3>
            <button onClick={() => { setShowAddMethod(!showAddMethod); if (showAddMethod) resetAddForm(); }} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 transition-all active:scale-95">
              <Plus size={14}/> Add Method
            </button>
          </div>

          {/* ── Upgrade Banner ── */}
          {upgradingToPlan && (
            <div className="p-5 bg-gradient-to-r from-[rgba(124,58,237,0.15)] to-[rgba(168,85,247,0.08)] border border-[rgba(124,58,237,0.3)] rounded-2xl flex items-center justify-between" style={{ animation: 'cardSectionIn 0.3s ease' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center shadow-lg">
                  <ArrowRight size={18} className="text-white"/>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Upgrading to <span className="text-[#c084fc] uppercase">{upgradingToPlan}</span></p>
                  <p className="text-[11px] text-[#6b7280]">Add a payment method below to confirm your upgrade</p>
                </div>
              </div>
              <button onClick={() => { setUpgradingToPlan(null); setBillingSubTab('plans'); }} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest font-bold">Cancel</button>
            </div>
          )}

          {/* ── Upgrade Success Toast ── */}
          {upgradeSuccess && (
            <div className="p-4 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] rounded-2xl flex items-center gap-3" style={{ animation: 'cardSectionIn 0.3s ease' }}>
              <CheckCircle2 size={20} className="text-[#10b981] shrink-0"/>
              <div>
                <p className="text-[13px] font-bold text-[#10b981]">Plan upgraded successfully!</p>
                <p className="text-[11px] text-[#6b7280]">Your new plan is now active. Enjoy the premium features.</p>
              </div>
            </div>
          )}

          {/* ── Add Method Flow ── */}
          {showAddMethod && (
            <div className="p-6 bg-[#18191d] border border-[#7c3aed] rounded-2xl space-y-4" style={{ animation: 'cardSectionIn 0.25s ease' }}>

              {/* Step 1: Pick type */}
              {addStep === 'pick' && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Select Payment Type</p>
                    <button onClick={resetAddForm} className="text-[#6b7280] hover:text-white"><X size={16}/></button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      { type: 'card' as const, label: 'Credit Card', icon: <CreditCard size={20}/> },
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

              {/* Step 2: Card form */}
              {addStep === 'form' && addType === 'card' && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Enter Card Details</p>
                    <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Cardholder Name</label>
                      <input value={formCard.name} onChange={e => setFormCard(p => ({...p, name: e.target.value}))} placeholder="John Doe"
                        className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Card Number</label>
                      <input value={formCard.number} onChange={e => setFormCard(p => ({...p, number: e.target.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ').trim()}))} placeholder="4242 4242 4242 4242" maxLength={19}
                        className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none tracking-wider transition-colors"/>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Expiry</label>
                        <input value={formCard.exp} onChange={e => setFormCard(p => ({...p, exp: e.target.value}))} placeholder="MM/YY" maxLength={5}
                          className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">CVV</label>
                        <input value={formCard.cvv} onChange={e => setFormCard(p => ({...p, cvv: e.target.value.replace(/\D/g,'')}))} placeholder="•••" maxLength={4} type="password"
                          className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#6b7280] uppercase tracking-widest block mb-1">Credit Limit</label>
                        <input value={formLimit} onChange={e => setFormLimit(e.target.value.replace(/\D/g,''))} placeholder="5000"
                          className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formCard.number || !formCard.exp || !formCard.name}
                    className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {addingMethod ? <><Loader2 size={14} className="animate-spin"/> Processing...</> : 'Add Card'}
                  </button>
                </>
              )}

              {/* Step 2: UPI form */}
              {addStep === 'form' && addType === 'upi' && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Enter UPI ID</p>
                    <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                  </div>
                  <div className="relative">
                    <input value={formUpi} onChange={e => { setFormUpi(e.target.value); setUpiError(''); }} placeholder="yourname@okaxis"
                      className={`w-full px-3 py-2.5 bg-[#0e0f11] border rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] outline-none transition-colors ${upiError ? 'border-[#ef4444]' : 'border-[#2a2c33] focus:border-[#7c3aed]'}`}/>
                    {formUpi && /^[a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+$/.test(formUpi) && (
                      <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10b981]"/>
                    )}
                  </div>
                  {upiError && <div className="flex items-center gap-2 text-[#ef4444] text-[11px]"><XCircle size={12}/> {upiError}</div>}
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone for SMS receipt (+91...)"
                    className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                  <p className="text-[10px] text-[#6b7280]">Supported banks: @okaxis, @okhdfcbank, @oksbi, @paytm, @ybl, @ibl</p>
                  <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formUpi}
                    className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    Verify & Link UPI
                  </button>
                </>
              )}

              {/* UPI Verification Progress */}
              {addStep === 'verifying' && addType === 'upi' && (
                <div className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">Verifying UPI: {formUpi}</p>
                  {upiSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      {step.status === 'done' && <CheckCircle2 size={16} className="text-[#10b981] shrink-0"/>}
                      {step.status === 'active' && <Loader2 size={16} className="text-[#7c3aed] animate-spin shrink-0"/>}
                      {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-[#2a2c33] shrink-0"/>}
                      <span className={`text-[12px] ${step.status === 'done' ? 'text-[#10b981]' : step.status === 'active' ? 'text-white' : 'text-[#6b7280]'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: PayPal / GPay form */}
              {addStep === 'form' && (addType === 'paypal' || addType === 'gpay') && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#c084fc]">
                      Enter {addType === 'gpay' ? 'Google Pay' : 'PayPal'} Email
                    </p>
                    <button onClick={() => setAddStep('pick')} className="text-[#6b7280] hover:text-white text-[10px] uppercase tracking-widest">← Back</button>
                  </div>
                  <input value={formEmail} onChange={e => setFormEmail(e.target.value)}
                    placeholder={addType === 'gpay' ? 'you@gmail.com' : 'you@paypal.com'} type="email"
                    className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#7c3aed] outline-none transition-colors"/>
                  <button onClick={handleSubmitMethod} disabled={!!addingMethod || !formEmail}
                    className="w-full py-2.5 bg-[#7c3aed] text-white text-[11px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#6d28d9] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {addingMethod ? <><Loader2 size={14} className="animate-spin"/> Connecting...</> : `Link ${addType === 'gpay' ? 'Google Pay' : 'PayPal'}`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {paymentMethods.length === 0 && !showAddMethod && (
            <div className="text-center py-16 text-[#6b7280]">
              <CreditCard size={36} className="mx-auto mb-4 opacity-30"/>
              <p className="text-[14px] font-semibold mb-1">No payment methods added yet</p>
              <p className="text-[11px]">Click "Add Method" above to get started</p>
            </div>
          )}

          {/* ── Saved methods list ── */}
          <div className="space-y-3">
            {paymentMethods.map(pm => {
              const isExpanded = expandedCardId === pm.id;
              const controls = cardControls[pm.id] || { online: true, intl: false, atm: true, nfc: true };
              const pctUsed = pm.type === 'Credit Card' && pm.limit > 0 ? ((pm.used / pm.limit) * 100).toFixed(0) : 0;

              return (
                <div key={pm.id} className="bg-[#18191d] border border-[#2a2c33] rounded-2xl overflow-hidden transition-all group">
                  {/* Row */}
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
                            {pm.type === 'Credit Card' ? (
                              <span className="flex items-center gap-3">
                                <span className="tracking-widest opacity-50">•••• ••••</span>
                                <span>{pm.last4}</span>
                              </span>
                            ) : (pm.vpa || pm.email)}
                          </p>
                          {pm.isDefault && (
                            <span className="text-[9px] bg-[rgba(124,58,237,0.15)] text-[#c084fc] px-2 py-0.5 rounded-md border border-[rgba(124,58,237,0.3)] uppercase tracking-widest">Default</span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[#6b7280]">
                          {pm.type === 'Credit Card' ? `Expires ${pm.exp}` : pm.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {pm.type === 'Credit Card' && (
                        <div className="text-[#6b7280] p-2 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                          <ChevronDown size={16}/>
                        </div>
                      )}
                      {!pm.isDefault && (
                        <button onClick={(e) => { e.stopPropagation(); setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === pm.id }))); }}
                          className="p-2 text-[#6b7280] hover:text-[#c084fc] hover:bg-[#2a2c33] rounded-lg transition-all" title="Set as default">
                          <Star size={16}/>
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setPaymentMethods(prev => prev.filter(m => m.id !== pm.id)); }}
                        className="p-2 text-[#6b7280] hover:text-[#ef4444] hover:bg-[#2a2c33] rounded-lg transition-all" title="Delete">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  {/* Expanded card dashboard */}
                  {isExpanded && pm.type === 'Credit Card' && (
                    <div className="border-t border-[#2a2c33] bg-[#121316] p-6 space-y-5" style={{ animation: 'cardSectionIn 0.25s ease' }}>
                      {/* Usage bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-[#6b7280] uppercase tracking-widest">Credit Usage</span>
                          <span className="text-[12px] font-bold text-white">₹{pm.used.toLocaleString()} <span className="text-[#6b7280] font-normal">/ ₹{pm.limit.toLocaleString()}</span></span>
                        </div>
                        <div className="h-2 w-full bg-[#1e2026] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-full transition-all duration-1000" style={{ width: `${pctUsed}%` }}/>
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-[#6b7280] font-mono">
                          <span>{pctUsed}% Used</span>
                          <span>Available: ₹{(pm.limit - pm.used).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        {/* Quick links */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest mb-3">Billing & Services</p>
                          {[
                            { icon: FileText, label: 'Statements', desc: 'View recent statements' },
                            { icon: PieChart, label: 'EMI Offers', desc: 'Convert to EMI' },
                            { icon: Percent, label: 'Interest & Charges', desc: 'View rates' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1e2026] border border-transparent hover:border-[#2a2c33] transition-all cursor-pointer group/link">
                              <div className="w-8 h-8 rounded-lg bg-[#18191d] border border-[#2a2c33] flex items-center justify-center text-[#6b7280] group-hover/link:text-[#7c3aed] transition-colors">
                                <item.icon size={14}/>
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-[#e8eaf0]">{item.label}</p>
                                <p className="text-[10px] text-[#6b7280]">{item.desc}</p>
                              </div>
                              <ChevronRight size={14} className="ml-auto text-[#6b7280] opacity-0 group-hover/link:opacity-100 transition-all"/>
                            </div>
                          ))}
                        </div>

                        {/* Security controls */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest mb-3">Security & Controls</p>
                          <div className="bg-[#18191d] border border-[#2a2c33] rounded-xl p-1">
                            {[
                              { key: 'online', label: 'Online Transactions', icon: Globe },
                              { key: 'intl', label: 'International Usage', icon: Smartphone },
                              { key: 'atm', label: 'ATM Withdrawals', icon: Landmark },
                              { key: 'nfc', label: 'Tap & Pay (NFC)', icon: ShieldAlert },
                            ].map((ctrl, i) => (
                              <div key={ctrl.key} className={`flex items-center justify-between p-3 ${i !== 3 ? 'border-b border-[#2a2c33]' : ''}`}>
                                <div className="flex items-center gap-3 text-[#6b7280]">
                                  <ctrl.icon size={14} className={(controls as any)[ctrl.key] ? 'text-[#10b981]' : ''}/>
                                  <span className="text-[12px] font-medium text-[#e8eaf0]">{ctrl.label}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleToggleControl(pm.id, ctrl.key); }}
                                  className={`w-8 h-[18px] rounded-full transition-colors relative ${(controls as any)[ctrl.key] ? 'bg-[#10b981]' : 'bg-[#2a2c33]'}`}>
                                  <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-transform duration-300 ${(controls as any)[ctrl.key] ? 'translate-x-[16px]' : 'translate-x-[2px]'}`}/>
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

          {/* ── Razorpay Checkout ── */}
          <div className="mt-6 pt-6 border-t border-[#2a2c33]">
            <div className="bg-[#18191d] border border-[#2a2c33] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[#0EA5E9]"/>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#9ca3af]">Razorpay Checkout</p>
              </div>
              <p className="text-[12px] text-[#6b7280]">Verify your identity and add a payment method instantly through Razorpay's secure checkout.</p>
              <input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="Phone number for SMS receipt (e.g. +919876543210)"
                className="w-full px-3 py-2.5 bg-[#0e0f11] border border-[#2a2c33] rounded-lg text-white text-[13px] font-mono placeholder:text-[#3a3d45] focus:border-[#0EA5E9] outline-none transition-colors"/>
              <button onClick={handleRazorpayCheckout} disabled={!formPhone}
                className="w-full py-3 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white text-[12px] uppercase tracking-widest font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
                <Zap size={16}/> Pay with Razorpay
              </button>
              <p className="text-center text-[10px] text-[#33363f]">Secure payment via Razorpay • SMS confirmation sent on success</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Sales Modal ── */}
      {showContactSales && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="w-full max-w-[500px] bg-[#111214] border border-[#2a2c33] rounded-3xl overflow-hidden shadow-2xl" style={{ animation: 'cardSectionIn 0.3s ease' }}>
            <div className="p-6 border-b border-[#2a2c33] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(124,58,237,0.15)] flex items-center justify-center text-[#c084fc]">
                  <MessageSquare size={20}/>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold">Contact Enterprise Sales</h3>
                  <p className="text-[11px] text-[#6b7280]">Scale your workspace with dedicated support</p>
                </div>
              </div>
              <button onClick={() => setShowContactSales(false)} className="text-[#6b7280] hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
              {contactSubmitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mx-auto text-[#10b981]">
                    <CheckCircle2 size={32}/>
                  </div>
                  <div>
                    <h4 className="text-[18px] font-bold text-white">Request Sent!</h4>
                    <p className="text-[13px] text-[#6b7280] mt-1">One of our Salespersons will contact you soon.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] flex items-center gap-1.5">
                        <Users size={10}/> Full Name
                      </label>
                      <input required type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}
                        className="w-full bg-[#0e0f11] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:border-[#7c3aed] outline-none transition-all"/>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] flex items-center gap-1.5">
                        <Mail size={10}/> Email
                      </label>
                      <input required type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})}
                        className="w-full bg-[#0e0f11] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:border-[#7c3aed] outline-none transition-all"/>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] flex items-center gap-1.5">
                      <Phone size={10}/> Phone Number
                    </label>
                    <input required type="tel" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} placeholder="+91 XXXX XXX XXX"
                      className="w-full bg-[#0e0f11] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:border-[#7c3aed] outline-none transition-all"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] flex items-center gap-1.5">
                      <Info size={10}/> Reasoning / Description
                    </label>
                    <textarea required rows={4} value={contactForm.description} onChange={e => setContactForm({...contactForm, description: e.target.value})} placeholder="Tell us about your organization's needs..."
                      className="w-full bg-[#0e0f11] border border-[#2a2c33] rounded-xl px-4 py-2.5 text-[13px] text-white focus:border-[#7c3aed] outline-none transition-all resize-none"/>
                  </div>
                  <button type="submit" disabled={isSubmittingContact}
                    className="w-full bg-[#7c3aed] hover:bg-[#a855f7] text-white py-3.5 rounded-2xl font-bold text-[14px] transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                    {isSubmittingContact ? <Loader2 size={18} className="animate-spin"/> : <><Zap size={16} className="group-hover:animate-pulse"/> Submit Request</>}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardSectionIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
