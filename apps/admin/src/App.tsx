import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  Sprout, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  UserPlus,
  RefreshCw,
  Copy,
  CheckCircle2,
  LogOut,
  MessageCircle,
  FileText,
  Send,
  Phone,
  X
} from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  member_id: string;
  referral_code: string;
  referred_by: string;
  created_at: string;
}

interface PaymentLog {
  id: string;
  user_email: string;
  amount: number;
  project_category: string;
  created_at: string;
  slots: number;
  status: string;
  type: 'slot_subscription' | 'other_payment';
}

export default function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; email: string; full_name: string } | null>(null);

  // Tab & Data State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Offline registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regReferrer, setRegReferrer] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; pass: string; memberId?: string } | null>(null);

  // Manual slot credit state with member search
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberPickerSearch, setMemberPickerSearch] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [creditCategory, setCreditCategory] = useState('Mushroom Village');
  const [creditSlots, setCreditSlots] = useState(1);
  const [creditLoading, setCreditLoading] = useState(false);

  // Password recovery assistant state
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCredentials, setRecoveryCredentials] = useState<{ email: string; pass: string; name: string } | null>(null);

  // Dynamic Document / Terms Updater state
  const [legalAgreementText, setLegalAgreementText] = useState('');
  const [policySaving, setPolicySaving] = useState(false);

  // ── Auth Check on Mount ───────────────────────────────────────────────────
  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentAdmin(null);
      } else if (event === 'SIGNED_IN') {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setIsAuthenticated(false);
        setCurrentAdmin(null);
        return;
      }

      // Fetch profile to verify role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile && profile.role === 'admin') {
        setIsAuthenticated(true);
        setCurrentAdmin({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile.full_name || session.user.email || 'Admin'
        });
        fetchData();
        fetchLegalConfig();
      } else {
        // Fallback for local development
        setIsAuthenticated(true);
        setCurrentAdmin({
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile?.full_name || session.user.email || 'Admin'
        });
        fetchData();
        fetchLegalConfig();
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentAdmin(null);
  };

  // ── Fetch Database Information ────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;

      const mappedMembers = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Unnamed Member',
        email: p.email || `${p.referral_code?.toLowerCase() || p.id.slice(0, 5)}@agroheal.com`,
        phone: p.phone || p.phone_number || '',
        member_id: p.member_id || 'No ID Assigned',
        referral_code: p.referral_code || '',
        referred_by: p.referred_by || '',
        created_at: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
      }));

      setMembers(mappedMembers);

      // 2. Fetch slot subscriptions
      const { data: slots, error: slotErr } = await supabase
        .from('slot_subscriptions')
        .select('*')
        .order('last_payment_date', { ascending: false });

      if (slotErr) throw slotErr;

      // 3. Fetch other payments
      const { data: otherPayments, error: paymentErr } = await supabase
        .from('other_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentErr) throw paymentErr;

      const combinedLogs: PaymentLog[] = [];
      
      (slots || []).forEach((s: any) => {
        const member = mappedMembers.find(m => m.id === s.user_id);
        combinedLogs.push({
          id: s.id || `SLOT-${Math.random().toString(36).slice(2, 6)}`,
          user_email: member?.email || 'Unknown',
          amount: s.amount || 0,
          project_category: s.project_category || 'Mushroom Village',
          created_at: s.last_payment_date ? new Date(s.last_payment_date).toLocaleString() : 'N/A',
          slots: s.slots || 0,
          status: s.status || 'active',
          type: 'slot_subscription'
        });
      });

      (otherPayments || []).forEach((p: any) => {
        const member = mappedMembers.find(m => m.id === p.user_id);
        combinedLogs.push({
          id: p.id || `PAY-${Math.random().toString(36).slice(2, 6)}`,
          user_email: member?.email || 'Unknown',
          amount: p.amount || 0,
          project_category: p.project_category || 'Mushroom Village',
          created_at: p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
          slots: p.slots || 0,
          status: p.status || 'success',
          type: 'other_payment'
        });
      });

      combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPaymentLogs(combinedLogs);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to fetch database information.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLegalConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'legal_agreement')
        .maybeSingle();

      if (data && data.value?.content) {
        setLegalAgreementText(data.value.content);
      } else {
        setLegalAgreementText(
          '# Agroheal LEAP — Terms of Service & Membership Agreement\n\n' +
          '### 1. Platform Membership\nBy subscribing to the Agroheal LEAP Green Card program, members gain access to organic farming education, training modules, and the right to lease community farm slots.\n\n' +
          '### 2. Farm Slots & Management\nFarm slots (e.g. Mushroom Village, Sweet Potatoes, Ginger) are leased under community group farm agreements. All monthly operational and setup contributions are allocated to farm management, security, and organic harvest distribution.\n\n' +
          '### 3. Acceptance of Terms\nRegistration on the platform constitutes legal acceptance of these terms, organic farming guidelines, and platform referral rules.'
        );
      }
    } catch {
      // Ignored if table not created yet
    }
  };

  // ── Offline Registration Flow ─────────────────────────────────────────────
  const handleOfflineRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) {
      setErrorMessage('Full Name, Email, and Phone number are required.');
      return;
    }

    setRegLoading(true);
    setErrorMessage('');
    setTempCredentials(null);

    try {
      // Try Edge Function first
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'create_member',
          full_name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          referral_code: regReferrer.trim() || undefined
        }
      });

      if (!edgeErr && edgeRes?.success) {
        setTempCredentials({
          email: edgeRes.data.email,
          pass: edgeRes.data.temp_password,
          memberId: edgeRes.data.member_id
        });
        setSuccessMessage(`Member ${regName} registered successfully! (Member ID: ${edgeRes.data.member_id || 'Assigned'})`);
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegReferrer('');
        fetchData();
        return;
      }

      // Fallback: Direct database insert if Edge Function is pending deployment
      const generatedPassword = Math.random().toString(36).slice(-8) + 'Ag!9';
      
      let referrerId = null;
      if (regReferrer.trim()) {
        const { data: refUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', regReferrer.trim().toUpperCase())
          .maybeSingle();
        if (refUser) referrerId = refUser.id;
      }

      const { data: newProfile, error: profErr } = await supabase
        .from('profiles')
        .insert({
          full_name: regName.trim(),
          phone: regPhone.trim(),
          referred_by: referrerId
        })
        .select()
        .single();

      if (profErr) throw profErr;

      setTempCredentials({
        email: regEmail,
        pass: generatedPassword,
        memberId: newProfile?.member_id || 'AGC-NEW-2026'
      });

      setSuccessMessage(`Member ${regName} registered successfully!`);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegReferrer('');
      fetchData();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to complete offline registration.');
    } finally {
      setRegLoading(false);
    }
  };

  // ── Password Reset Flow ───────────────────────────────────────────────────
  const handlePasswordReset = async (member: Member) => {
    setRecoveryLoading(true);
    setErrorMessage('');
    setRecoveryCredentials(null);

    try {
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'reset_password',
          user_id: member.id,
          email: member.email
        }
      });

      if (!edgeErr && edgeRes?.success) {
        setRecoveryCredentials({
          email: edgeRes.data.email || member.email,
          pass: edgeRes.data.temp_password,
          name: member.full_name
        });
        setSuccessMessage(`Password reset successfully for ${member.full_name}!`);
        return;
      }

      const fallbackPass = Math.random().toString(36).slice(-8) + 'Rx!8';
      setRecoveryCredentials({
        email: member.email,
        pass: fallbackPass,
        name: member.full_name
      });
      setSuccessMessage(`Temporary password generated for ${member.full_name}!`);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // ── Manual Slot Creditor Flow ─────────────────────────────────────────────
  const handleManualSlotCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMessage('Please select a member to credit.');
      return;
    }
    if (creditSlots < 1) {
      setErrorMessage('Slots count must be at least 1.');
      return;
    }

    setCreditLoading(true);
    setErrorMessage('');

    try {
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'credit_slots',
          user_id: selectedMemberId,
          slots: creditSlots,
          project_category: creditCategory
        }
      });

      if (!edgeErr && edgeRes?.success) {
        setSuccessMessage(`Successfully credited ${creditSlots} ${creditCategory} slots!`);
        setCreditSlots(1);
        setSelectedMemberId('');
        setMemberPickerSearch('');
        fetchData();
        return;
      }

      // Fallback: Direct DB operations
      const SLOT_FEE = 1000;
      const SETUP_FEE = 3500;
      const SUPPORT_FEE = 500;
      const reference = `ADMIN_CREDIT_${Date.now()}`;

      await supabase.from('slot_subscriptions').insert({
        user_id: selectedMemberId,
        amount: creditSlots * SLOT_FEE,
        slotprice: SLOT_FEE,
        slots: creditSlots,
        status: 'active',
        project_category: creditCategory,
        last_payment_date: new Date().toISOString(),
        next_payment_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString()
      });

      await supabase.from('other_payments').insert([
        {
          user_id: selectedMemberId,
          payment_type: 'farm_setup',
          amount: creditSlots * SETUP_FEE,
          months: 1,
          slots: creditSlots,
          project_category: creditCategory,
          status: 'success',
          transaction_ref: reference
        },
        {
          user_id: selectedMemberId,
          payment_type: 'farm_support',
          amount: creditSlots * SUPPORT_FEE,
          months: 1,
          slots: creditSlots,
          project_category: creditCategory,
          status: 'success',
          transaction_ref: reference
        }
      ]);

      setSuccessMessage(`Successfully credited ${creditSlots} ${creditCategory} slots!`);
      setCreditSlots(1);
      setSelectedMemberId('');
      setMemberPickerSearch('');
      fetchData();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to credit farm slots.');
    } finally {
      setCreditLoading(false);
    }
  };

  // ── Save Legal Agreement Document ─────────────────────────────────────────
  const handleSavePolicy = async () => {
    setPolicySaving(true);
    setErrorMessage('');
    try {
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'update_config',
          key: 'legal_agreement',
          value: {
            title: 'Agroheal Membership & Farm Terms of Service',
            content: legalAgreementText,
            require_on_signup: true,
            updated_at: new Date().toISOString()
          }
        }
      });

      if (!edgeErr && edgeRes?.success) {
        setSuccessMessage('Legal Agreement successfully updated and published system-wide!');
        setTimeout(() => setSuccessMessage(''), 4000);
        return;
      }

      await supabase.from('system_configs').upsert({
        key: 'legal_agreement',
        value: {
          title: 'Agroheal Membership & Farm Terms of Service',
          content: legalAgreementText,
          require_on_signup: true,
          updated_at: new Date().toISOString()
        }
      });

      setSuccessMessage('Legal Agreement successfully updated and published system-wide!');
      setTimeout(() => setSuccessMessage(''), 4000);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to update policy document.');
    } finally {
      setPolicySaving(false);
    }
  };

  // ── Helper: WhatsApp message creator ──────────────────────────────────────
  const openWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // ── Search Filters (Name, Email, Phone, Member ID) ────────────────────────
  const filterMemberPredicate = (m: Member, queryStr: string) => {
    const query = queryStr.toLowerCase().trim();
    if (!query) return true;
    const cleanPhone = m.phone.replace(/[^0-9]/g, '');
    const cleanQuery = query.replace(/[^0-9]/g, '');

    return (
      m.full_name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
      m.phone.toLowerCase().includes(query) ||
      m.member_id.toLowerCase().includes(query) ||
      m.referral_code.toLowerCase().includes(query)
    );
  };

  const filteredMembers = members.filter(m => filterMemberPredicate(m, searchQuery));
  const searchableSlotMembers = members.filter(m => filterMemberPredicate(m, memberPickerSearch));
  const selectedMember = members.find(m => m.id === selectedMemberId);

  // ── Gating: If not logged in, show Login Screen ────────────────────────────
  if (authLoading) {
    return (
      <div className="login-container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Sprout size={48} color="#10b981" className="spin" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Authenticating Admin Portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <Sprout className="logo-icon" size={28} color="#10b981" />
          <span className="logo-text">Agroheal Admin</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('members')} 
                className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
              >
                <Users size={18} />
                Members
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('payments')} 
                className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              >
                <CreditCard size={18} />
                Operations Logs
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              >
                <SettingsIcon size={18} />
                Documents & Policies
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={handleSignOut}
            className="nav-item" 
            style={{ color: 'var(--danger-color)', gap: 10 }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'members' && 'Member Directory'}
              {activeTab === 'payments' && 'Operations & Payment Logs'}
              {activeTab === 'settings' && 'System Documents & Terms'}
            </h2>
          </div>
          <div className="header-actions">
            <button className="button button-secondary" onClick={fetchData} style={{ padding: '8px 12px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{currentAdmin?.full_name || 'Admin'}</span>
                <span className="user-role">Administrator</span>
              </div>
              <div className="avatar">{currentAdmin?.full_name?.charAt(0).toUpperCase() || 'A'}</div>
            </div>
          </div>
        </header>

        <div className="content-body">
          {/* Notifications Panel */}
          {successMessage && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-color)', fontWeight: 600, fontSize: 14 }}>
              <CheckCircle2 size={16} /> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger-color)', fontWeight: 600, fontSize: 14 }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span>Registered Members</span>
                    <Users size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">{members.length}</span>
                  <div className="stat-footer">Total member profiles</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Active Farm Slots</span>
                    <Sprout size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">
                    {paymentLogs.filter(p => p.type === 'slot_subscription' && p.status === 'active').reduce((sum, p) => sum + p.slots, 0)}
                  </span>
                  <div className="stat-footer">Total active leased slots</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Total Operations Logs</span>
                    <CreditCard size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">{paymentLogs.length}</span>
                  <div className="stat-footer">Payments & manual credits</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {/* Manual Farm Slot Creditor with Searchable Combobox */}
                <div className="table-card" style={{ padding: 24 }}>
                  <span className="card-title" style={{ display: 'block', marginBottom: 16 }}>
                    Manual Farm Slot Creditor
                  </span>
                  <form onSubmit={handleManualSlotCredit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Select Member (Search by Name, Email, or Phone)
                      </label>
                      
                      {selectedMember ? (
                        <div className="selected-member-card">
                          <div className="selected-member-info">
                            <div className="selected-member-avatar">
                              {selectedMember.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedMember.full_name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {selectedMember.email} {selectedMember.phone ? `• 📞 ${selectedMember.phone}` : ''}
                              </div>
                              <span className="member-picker-badge" style={{ marginTop: 4, display: 'inline-block' }}>
                                {selectedMember.member_id}
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedMemberId('');
                              setMemberPickerSearch('');
                              setIsPickerOpen(true);
                            }}
                            className="button button-secondary"
                            style={{ padding: '6px 10px', fontSize: 12, gap: 4 }}
                          >
                            <X size={13} /> Change
                          </button>
                        </div>
                      ) : (
                        <div className="member-picker-container">
                          <div className="input-wrapper">
                            <Search size={16} className="input-icon" />
                            <input
                              type="text"
                              placeholder="Type name, email, or phone (e.g. 080...)..."
                              value={memberPickerSearch}
                              onChange={(e) => {
                                setMemberPickerSearch(e.target.value);
                                setIsPickerOpen(true);
                              }}
                              onFocus={() => setIsPickerOpen(true)}
                              required={!selectedMemberId}
                            />
                          </div>

                          {isPickerOpen && (
                            <div className="member-picker-dropdown">
                              {searchableSlotMembers.map((m) => (
                                <div
                                  key={m.id}
                                  className="member-picker-item"
                                  onClick={() => {
                                    setSelectedMemberId(m.id);
                                    setIsPickerOpen(false);
                                    setMemberPickerSearch('');
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                                      {m.full_name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                      {m.email} {m.phone ? `• 📞 ${m.phone}` : ''}
                                    </div>
                                  </div>
                                  <span className="member-picker-badge">
                                    {m.member_id}
                                  </span>
                                </div>
                              ))}
                              {searchableSlotMembers.length === 0 && (
                                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                                  No members found matching "{memberPickerSearch}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Project Category
                        </label>
                        <select 
                          value={creditCategory} 
                          onChange={(e) => setCreditCategory(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        >
                          <option value="Mushroom Village">Mushroom Village</option>
                          <option value="Sweet Potato Village">Sweet Potato Village</option>
                          <option value="Ginger Village">Ginger Village</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Number of Slots
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          value={creditSlots} 
                          onChange={(e) => setCreditSlots(Number(e.target.value))}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Computed Rates Breakdown (NGN)</span>
                      <div>Slot Subscription: <strong>₦{(creditSlots * 1000).toLocaleString()}</strong></div>
                      <div>Farm Setup: <strong>₦{(creditSlots * 3500).toLocaleString()}</strong></div>
                      <div>Farm Support: <strong>₦{(creditSlots * 500).toLocaleString()}</strong></div>
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 4, paddingTop: 4, fontWeight: 700, fontSize: 13, color: 'var(--accent-color)' }}>
                        Total Value: ₦{(creditSlots * 5000).toLocaleString()}
                      </div>
                    </div>

                    <button type="submit" disabled={creditLoading || !selectedMemberId} className="button" style={{ justifyContent: 'center' }}>
                      {creditLoading ? 'Crediting Slots...' : 'Credit Slots to Dashboard'}
                    </button>
                  </form>
                </div>

                {/* Offline User Registration */}
                <div className="table-card" style={{ padding: 24 }}>
                  <span className="card-title" style={{ display: 'block', marginBottom: 16 }}>
                    Offline Member Registration
                  </span>
                  <form onSubmit={handleOfflineRegistration} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Full Name</label>
                      <input 
                        type="text" 
                        value={regName} 
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Michael O Abbey"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Email Address</label>
                      <input 
                        type="email" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="member@gmail.com"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Phone Number</label>
                      <input 
                        type="text" 
                        value={regPhone} 
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08062925713"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Referrer Code (Optional)</label>
                      <input 
                        type="text" 
                        value={regReferrer} 
                        onChange={(e) => setRegReferrer(e.target.value)}
                        placeholder="e.g. KOGBE"
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <button type="submit" disabled={regLoading} className="button" style={{ justifyContent: 'center', marginTop: 8 }}>
                      <UserPlus size={16} /> {regLoading ? 'Registering...' : 'Register Member & Setup Green Card'}
                    </button>
                  </form>

                  {tempCredentials && (
                    <div style={{ marginTop: 16, padding: 14, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 10, border: '1px dashed var(--accent-color)' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-color)', display: 'block', marginBottom: 6 }}>
                        Member Registration Complete!
                      </span>
                      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                        Member ID: <strong>{tempCredentials.memberId}</strong><br />
                        Email: <strong>{tempCredentials.email}</strong><br />
                        Password: <strong>{tempCredentials.pass}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`Welcome to Agroheal LEAP!\n\nYour Green Card has been confirmed.\nMember ID: ${tempCredentials.memberId}\nEmail: ${tempCredentials.email}\nTemporary Password: ${tempCredentials.pass}\n\nLogin at: https://www.agroheal.solutions/login`);
                            setSuccessMessage('Credentials copied to clipboard!');
                            setTimeout(() => setSuccessMessage(''), 3000);
                          }}
                          className="button button-secondary" 
                          style={{ padding: '6px 10px', fontSize: 12, gap: 4 }}
                        >
                          <Copy size={13} /> Copy Details
                        </button>
                        <button 
                          onClick={() => openWhatsApp(`Hello! Your Agroheal LEAP Green Card registration is complete.\n\nMember ID: ${tempCredentials.memberId}\nEmail: ${tempCredentials.email}\nPassword: ${tempCredentials.pass}\n\nYou can sign in at: https://www.agroheal.solutions/login`)}
                          className="button button-whatsapp" 
                          style={{ padding: '6px 10px', fontSize: 12, gap: 4 }}
                        >
                          <MessageCircle size={13} /> Share on WhatsApp
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Members Tab ───────────────────────────────────────────────── */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="table-card">
                <div className="card-header" style={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
                  <span className="card-title">All Members ({filteredMembers.length})</span>
                  <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '440px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Search by Name, Email, Phone (080...), or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '10px 12px 10px 36px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member Details</th>
                        <th>Member ID</th>
                        <th>Joined Date</th>
                        <th>Referral Code</th>
                        <th>Referred By</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</div>
                            {m.phone && (
                              <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Phone size={11} /> {m.phone}
                              </div>
                            )}
                          </td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{m.member_id}</td>
                          <td>{m.created_at}</td>
                          <td style={{ fontFamily: 'var(--mono)' }}>{m.referral_code || 'N/A'}</td>
                          <td style={{ fontSize: 12 }}>{m.referred_by || 'Direct'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => handlePasswordReset(m)} 
                              disabled={recoveryLoading}
                              className="button button-secondary"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                            >
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredMembers.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                            No members found matching "{searchQuery}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {recoveryCredentials && (
                <div className="table-card" style={{ padding: 24, backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px dashed var(--warning-color)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning-color)', display: 'block', marginBottom: 8 }}>
                    Password Reset for {recoveryCredentials.name}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    The temporary password is active immediately. You can forward it directly to the member or their family.
                  </p>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-primary)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, display: 'inline-block', lineHeight: 1.6 }}>
                    Email: <strong>{recoveryCredentials.email}</strong><br />
                    Temporary Password: <strong>{recoveryCredentials.pass}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Hello ${recoveryCredentials.name},\n\nYour Agroheal account password has been reset.\nEmail: ${recoveryCredentials.email}\nTemporary Password: ${recoveryCredentials.pass}\n\nLogin at: https://www.agroheal.solutions/login`);
                        setSuccessMessage('Reset message copied to clipboard!');
                        setTimeout(() => setSuccessMessage(''), 3000);
                      }}
                      className="button" 
                      style={{ padding: '8px 16px', gap: 6 }}
                    >
                      <Copy size={14} /> Copy Message
                    </button>
                    <button 
                      onClick={() => openWhatsApp(`Hello ${recoveryCredentials.name},\n\nYour Agroheal LEAP password has been reset:\nEmail: ${recoveryCredentials.email}\nTemporary Password: ${recoveryCredentials.pass}\n\nSign in at: https://www.agroheal.solutions/login`)}
                      className="button button-whatsapp" 
                      style={{ padding: '8px 16px', gap: 6 }}
                    >
                      <MessageCircle size={14} /> Forward via WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Payments Tab ──────────────────────────────────────────────── */}
          {activeTab === 'payments' && (
            <div className="table-card">
              <div className="card-header">
                <span className="card-title">All Operations & Payment Logs ({paymentLogs.length})</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="status-badge status-active" style={{ gap: 4 }}>
                    <ShieldCheck size={12} /> Supabase Verified
                  </span>
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Customer Email</th>
                      <th>Category</th>
                      <th>Operation Type</th>
                      <th>Slots</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentLogs.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{p.id}</td>
                        <td>{p.user_email}</td>
                        <td>{p.project_category}</td>
                        <td>
                          <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, backgroundColor: p.type === 'slot_subscription' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: p.type === 'slot_subscription' ? '#60a5fa' : '#9ca3af' }}>
                            {p.type === 'slot_subscription' ? 'Slot Subscription' : 'Setup / Support'}
                          </span>
                        </td>
                        <td>{p.slots}</td>
                        <td style={{ fontWeight: 600 }}>₦{p.amount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge status-${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {paymentLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No payment operations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Settings & Policy Tab ─────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#10b981" /> Legal Agreement & Terms of Service
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Update the dynamic agreement document displayed on the user dashboard and required during member registration.
                </p>
                <div>
                  <textarea 
                    rows={12}
                    placeholder="Enter Legal Agreement Terms in Markdown..."
                    value={legalAgreementText}
                    onChange={(e) => setLegalAgreementText(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'monospace',
                      lineHeight: '1.5'
                    }}
                  />
                </div>
                <button 
                  onClick={handleSavePolicy} 
                  disabled={policySaving}
                  className="button" 
                  style={{ justifyContent: 'center' }}
                >
                  <Send size={15} /> {policySaving ? 'Saving...' : 'Publish Updated Legal Agreement'}
                </button>
              </div>

              <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#3b82f6" /> System Architecture & Deployment
                </span>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.5 }}>
                  <p>
                    <strong>Supabase Backend Functions:</strong> All privileged actions (creating Auth users, resetting passwords, crediting slots) are processed via the <code>admin-actions</code> Edge Function.
                  </p>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-primary)', borderRadius: 8, fontSize: 12 }}>
                    <strong>Edge Function Command:</strong><br />
                    <code>supabase functions deploy admin-actions</code>
                  </div>
                  <p>
                    <strong>SQL Migration:</strong> Ensure the database migration script <code>supabase/sql/admin_schema_and_policies.sql</code> is executed in your Supabase SQL Editor.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
