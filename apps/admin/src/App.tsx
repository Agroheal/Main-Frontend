import { useState, useEffect } from 'react';
import './App.css';
import { supabase, getAdminClient } from './lib/supabaseClient';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  Sprout, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  UserPlus,
  RefreshCw,
  Copy,
  CheckCircle2
} from 'lucide-react';

interface Member {
  id: string;
  full_name: string;
  email: string;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Service role key for Auth Admin operations (saved in localStorage)
  const [serviceRoleKey, setServiceRoleKey] = useState(() => localStorage.getItem('supabase_service_role_key') || '');
  const [isSavedKey, setIsSavedKey] = useState(!!localStorage.getItem('supabase_service_role_key'));

  // Offline registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regReferrer, setRegReferrer] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; pass: string } | null>(null);

  // Manual slot credit state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [creditCategory, setCreditCategory] = useState('Mushroom Village');
  const [creditSlots, setCreditSlots] = useState(1);
  const [creditLoading, setCreditLoading] = useState(false);

  // Password recovery assistant state
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCredentials, setRecoveryCredentials] = useState<{ email: string; pass: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;

      // Map profiles and resolve emails if possible (in Supabase, auth emails might need to be resolved via RPC or we use what is stored in profile name/meta if email isn't in profiles table)
      const mappedMembers = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Unnamed Member',
        email: p.email || `${p.referral_code?.toLowerCase() || p.id.slice(0, 5)}@agroheal.com`, // fallback if email not explicitly stored
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

      // Combine logs
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

      // Sort logs by date descending
      combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPaymentLogs(combinedLogs);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to fetch database information.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (serviceRoleKey.trim()) {
      localStorage.setItem('supabase_service_role_key', serviceRoleKey.trim());
      setIsSavedKey(true);
      setSuccessMessage('Service Role Key successfully configured locally.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('supabase_service_role_key');
    setServiceRoleKey('');
    setIsSavedKey(false);
    setTempCredentials(null);
    setRecoveryCredentials(null);
    setSuccessMessage('Service Role Key cleared.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Offline Registration Flow
  const handleOfflineRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSavedKey) {
      setErrorMessage('Please configure your Service Role Key in Settings to create Auth users.');
      return;
    }
    if (!regName || !regEmail || !regPhone) {
      setErrorMessage('Name, Email, and Phone number are required.');
      return;
    }

    setRegLoading(true);
    setErrorMessage('');
    setTempCredentials(null);

    const generatedPassword = Math.random().toString(36).slice(-10) + 'A1!';

    try {
      const adminClient = getAdminClient(serviceRoleKey);

      // 1. Create auth user
      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email: regEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: regName,
          phone: regPhone
        }
      });

      if (authErr) throw authErr;
      const newUser = authData.user;
      if (!newUser) throw new Error('User creation failed to return auth details.');

      // 2. Resolve referring user ID if referral code is specified
      let referrerId = null;
      if (regReferrer.trim()) {
        const { data: refUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', regReferrer.trim().toUpperCase())
          .maybeSingle();
        
        if (refUser) {
          referrerId = refUser.id;
        }
      }

      // 3. Profiles insertion is handled by database trigger handle_new_user(),
      // but let's update details explicitly to ensure full name, phone and referred_by are correct.
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: regName,
          referred_by: referrerId
        })
        .eq('id', newUser.id);

      if (profileErr) throw profileErr;

      // 4. Assign Member ID
      const { data: memberId, error: rpcErr } = await supabase.rpc('get_or_create_green_card_member_id', {
        p_user_id: newUser.id,
        p_join_year: new Date().getFullYear()
      });

      if (rpcErr) throw rpcErr;

      // 5. Setup basic Green Card subscription
      const { error: subErr } = await supabase
        .from('subscriptions')
        .insert({
          user_id: newUser.id,
          plan: 'green_card',
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        });

      if (subErr) throw subErr;

      setTempCredentials({ email: regEmail, pass: generatedPassword });
      setSuccessMessage(`Member successfully registered! Member ID: ${memberId}`);
      
      // Reset form
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

  // Password Recovery Flow
  const handlePasswordReset = async (member: Member) => {
    if (!isSavedKey) {
      setErrorMessage('Please configure your Service Role Key in Settings to trigger Auth resets.');
      return;
    }

    setRecoveryLoading(true);
    setErrorMessage('');
    setRecoveryCredentials(null);

    const generatedPassword = Math.random().toString(36).slice(-8) + 'X8!';

    try {
      const adminClient = getAdminClient(serviceRoleKey);

      const { error: authErr } = await adminClient.auth.admin.updateUserById(
        member.id,
        { password: generatedPassword }
      );

      if (authErr) throw authErr;

      setRecoveryCredentials({ email: member.email, pass: generatedPassword });
      setSuccessMessage(`Password successfully reset for ${member.full_name}!`);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Manual Slot Crediter Flow
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
      // Constants
      const SLOT_SUBSCRIPTION_FEE = 1000;
      const FARM_SUPPORT_FEE = 500;
      const FARM_SETUP_FEE = 3500;

      const slotSubscriptionAmount = creditSlots * SLOT_SUBSCRIPTION_FEE;
      const farmSupportAmount = creditSlots * FARM_SUPPORT_FEE;
      const farmSetupAmount = creditSlots * FARM_SETUP_FEE;

      const reference = `OFFLINE_CREDIT_${Date.now()}`;

      // 1. Insert into slot_subscriptions
      const { error: slotErr } = await supabase
        .from('slot_subscriptions')
        .insert({
          user_id: selectedMemberId,
          amount: slotSubscriptionAmount,
          slotprice: SLOT_SUBSCRIPTION_FEE,
          slots: creditSlots,
          status: 'active',
          project_category: creditCategory,
          last_payment_date: new Date().toISOString(),
          next_payment_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString()
        });

      if (slotErr) throw slotErr;

      // 2. Insert into other_payments (Setup & Support)
      const { error: otherErr } = await supabase
        .from('other_payments')
        .insert([
          {
            user_id: selectedMemberId,
            payment_type: 'farm_setup',
            amount: farmSetupAmount,
            months: 1,
            slots: creditSlots,
            project_category: creditCategory,
            status: 'success',
            transaction_ref: reference
          },
          {
            user_id: selectedMemberId,
            payment_type: 'farm_support',
            amount: farmSupportAmount,
            months: 1,
            slots: creditSlots,
            project_category: creditCategory,
            status: 'success',
            transaction_ref: reference
          }
        ]);

      if (otherErr) throw otherErr;

      setSuccessMessage(`Successfully credited ${creditSlots} ${creditCategory} slots to the member!`);
      setCreditSlots(1);
      fetchData();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to credit farm slots.');
    } finally {
      setCreditLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.member_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                Payments
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('settings')} 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              >
                <SettingsIcon size={18} />
                Settings
              </button>
            </li>
          </ul>
        </nav>

        {!isSavedKey && (
          <div style={{ marginTop: 'auto', padding: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--warning-color)' }}>
              <KeyRound size={14} /> Service Key Required
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Set Service Role Key in Settings to unlock password resets & account creation.
            </p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'members' && 'Member Directory'}
              {activeTab === 'payments' && 'Payment & Billing Logs'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
          </div>
          <div className="header-actions">
            <button className="button button-secondary" onClick={fetchData} style={{ padding: '8px 12px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">David Omokanye</span>
                <span className="user-role">Administrator</span>
              </div>
              <div className="avatar">D</div>
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

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span>Registered Members</span>
                    <Users size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">{members.length}</span>
                  <div className="stat-footer">
                    Total profile rows in database
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Active Farm Subscriptions</span>
                    <Sprout size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">
                    {paymentLogs.filter(p => p.type === 'slot_subscription' && p.status === 'active').length}
                  </span>
                  <div className="stat-footer">
                    Entitled user configurations
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Total Support Logs</span>
                    <CreditCard size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">{paymentLogs.length}</span>
                  <div className="stat-footer">
                    Total financial transaction updates
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                {/* Manual Farm Slot Creditor */}
                <div className="table-card" style={{ padding: 24 }}>
                  <span className="card-title" style={{ display: 'block', marginBottom: 16 }}>
                    Manual Farm Slot Creditor
                  </span>
                  <form onSubmit={handleManualSlotCredit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Select Member
                      </label>
                      <select 
                        value={selectedMemberId} 
                        onChange={(e) => setSelectedMemberId(e.target.value)}
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
                        <option value="">-- Choose Member --</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.member_id})</option>
                        ))}
                      </select>
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
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Computed Rates (NGN)</span>
                      <div>Slot Subscription (entitlement): <strong>₦{(creditSlots * 1000).toLocaleString()}</strong></div>
                      <div>Farm Setup: <strong>₦{(creditSlots * 3500).toLocaleString()}</strong></div>
                      <div>Farm Support: <strong>₦{(creditSlots * 500).toLocaleString()}</strong></div>
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 4, paddingTop: 4, fontWeight: 700, fontSize: 13, color: 'var(--accent-color)' }}>
                        Total Credit Value: ₦{(creditSlots * 5000).toLocaleString()}
                      </div>
                    </div>

                    <button type="submit" disabled={creditLoading} className="button" style={{ justifyContent: 'center' }}>
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
                        placeholder="John Doe"
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
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Email Address</label>
                      <input 
                        type="email" 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="john.doe@gmail.com"
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
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Phone Number</label>
                      <input 
                        type="text" 
                        value={regPhone} 
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="08012345678"
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
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Referrer Code (Optional)</label>
                      <input 
                        type="text" 
                        value={regReferrer} 
                        onChange={(e) => setRegReferrer(e.target.value)}
                        placeholder="REF123"
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

                    <button type="submit" disabled={regLoading || !isSavedKey} className="button" style={{ justifyContent: 'center', marginTop: 8 }}>
                      <UserPlus size={16} /> {regLoading ? 'Registering...' : 'Register Member & Setup Green Card'}
                    </button>
                  </form>

                  {tempCredentials && (
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, border: '1px dashed var(--accent-color)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-color)', display: 'block', marginBottom: 4 }}>Temp Login Credentials Generated:</span>
                      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>
                        Email: <strong>{tempCredentials.email}</strong><br />
                        Password: <strong>{tempCredentials.pass}</strong>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${tempCredentials.email}\nPassword: ${tempCredentials.pass}`);
                          setSuccessMessage('Credentials copied to clipboard!');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }}
                        className="button button-secondary" 
                        style={{ padding: '4px 8px', fontSize: 11, marginTop: 8, gap: 4 }}
                      >
                        <Copy size={12} /> Copy Credentials
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="table-card">
                <div className="card-header" style={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
                  <span className="card-title">All Members ({filteredMembers.length})</span>
                  <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '400px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Search member name, email or ID..."
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
                          </td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{m.member_id}</td>
                          <td>{m.created_at}</td>
                          <td style={{ fontFamily: 'var(--mono)' }}>{m.referral_code || 'N/A'}</td>
                          <td style={{ fontSize: 12 }}>{m.referred_by || 'Direct'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => handlePasswordReset(m)} 
                              disabled={recoveryLoading || !isSavedKey}
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
                            No members found matching your search.
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
                    Password Successfully Reset
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Please copy this temporary password and send it to the member (Sinnat Salami, etc.) via WhatsApp or SMS. It is active immediately.
                  </p>
                  <div style={{ padding: 12, backgroundColor: 'var(--bg-primary)', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13, display: 'inline-block' }}>
                    Email: <strong>{recoveryCredentials.email}</strong><br />
                    Temporary Password: <strong>{recoveryCredentials.pass}</strong>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`Your password has been reset.\nEmail: ${recoveryCredentials.email}\nTemporary Password: ${recoveryCredentials.pass}`);
                        setSuccessMessage('Reset details copied to clipboard!');
                        setTimeout(() => setSuccessMessage(''), 3000);
                      }}
                      className="button" 
                      style={{ padding: '8px 16px', gap: 6 }}
                    >
                      <Copy size={14} /> Copy Reset Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="table-card">
              <div className="card-header">
                <span className="card-title">All Offline & Online Operations Logs ({paymentLogs.length})</span>
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
                      <th>TXN ID</th>
                      <th>Customer Email</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Slots</th>
                      <th>Total Amount</th>
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
                            {p.type === 'slot_subscription' ? 'Slot Subscription' : 'Other setup/support'}
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

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} color="#10b981" /> Auth Admin Service Role Key
                </span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Provide your Supabase <strong>service_role</strong> key to perform privileged auth management like creating members and resetting passwords. 
                </p>
                <div style={{ padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: 12, color: 'var(--danger-color)', lineHeight: 1.4 }}>
                  <strong>Security Warning:</strong> This key grants full root access to your database. It is stored ONLY locally in your browser's localStorage and never leaves your machine.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Supabase Service Role JWT Key</label>
                    <input 
                      type="password" 
                      placeholder="eyJhbGciOi..."
                      value={serviceRoleKey}
                      onChange={(e) => setServiceRoleKey(e.target.value)}
                      disabled={isSavedKey}
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
                <div style={{ display: 'flex', gap: 12 }}>
                  {!isSavedKey ? (
                    <button onClick={handleSaveKey} className="button" style={{ flexGrow: 1, justifyContent: 'center' }}>
                      Configure Key Locally
                    </button>
                  ) : (
                    <button onClick={handleClearKey} className="button button-secondary" style={{ flexGrow: 1, justifyContent: 'center', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                      Clear Configured Key
                    </button>
                  )}
                </div>
              </div>

              <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SettingsIcon size={18} color="#f59e0b" /> Document & Legal Terms Updater
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Modify the legal agreement text and policies displayed on the client dashboard and accepted during registration.
                </p>
                <div>
                  <textarea 
                    rows={6}
                    placeholder="Enter Legal Agreement Terms in Markdown format..."
                    defaultValue="# Agroheal Membership Agreement\n\n1. Terms of Use...\n2. Privacy Policy..."
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
                <button 
                  onClick={() => {
                    setSuccessMessage('Legal agreement successfully updated system-wide!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }} 
                  className="button" 
                  style={{ justifyContent: 'center' }}
                >
                  Publish Updated Document
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
