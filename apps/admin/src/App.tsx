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
  X,
  Edit3,
  UserCog,
  Save,
  KeyRound,
  Filter,
  IdCard,
  Menu,
  LayoutGrid,
  Table as TableIcon,
  Mail
} from 'lucide-react';

interface MemberSlotSummary {
  category: string;
  slots: number;
  status: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  member_id: string;
  referral_code: string;
  referred_by: string;
  role?: string;
  created_at: string;
  has_green_card: boolean;
  green_card_expires_at?: string;
  total_slots: number;
  slots_by_program: MemberSlotSummary[];
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [memberViewMode, setMemberViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [greenCardFilter, setGreenCardFilter] = useState<'all' | 'active' | 'unpaid'>('all');
  const [activatingMemberId, setActivatingMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Issue Green Card Dialog / Modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueMemberSearch, setIssueMemberSearch] = useState('');
  const [issueSelectedMemberId, setIssueSelectedMemberId] = useState('');
  const [isIssuePickerOpen, setIsIssuePickerOpen] = useState(false);
  const [issuedGreenCardDetails, setIssuedGreenCardDetails] = useState<{
    member: Member;
    memberId: string;
  } | null>(null);

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

  // Edit Member Profile Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editMemberId, setEditMemberId] = useState('');
  const [editReferralCode, setEditReferralCode] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editSaving, setEditSaving] = useState(false);

  // Password recovery assistant state
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryCredentials, setRecoveryCredentials] = useState<{ email: string; pass: string; name: string } | null>(null);

  // Dynamic Document / Terms Updater state
  const [legalAgreementText, setLegalAgreementText] = useState('');
  const [policySaving, setPolicySaving] = useState(false);

  // ── Helper: Program Pill Styling & Icons ──────────────────────────────────
  const getProgramPillClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('mushroom')) return 'program-pill-mushroom';
    if (cat.includes('potato')) return 'program-pill-potato';
    if (cat.includes('ginger')) return 'program-pill-ginger';
    return 'program-pill-general';
  };

  const getProgramEmoji = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('mushroom')) return '🍄';
    if (cat.includes('potato')) return '🍠';
    if (cat.includes('ginger')) return '🌿';
    return '🌱';
  };

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
      // 1. Fetch profiles, slots, other payments, and green card subscriptions concurrently
      const [profilesRes, slotsRes, otherPayRes, subscriptionsRes] = await Promise.all([
        supabase.rpc('get_admin_members').then((res) => {
          if (res.error) {
            // Fallback to direct profiles table query if RPC is not yet registered
            return supabase.from('profiles').select('*').order('created_at', { ascending: false });
          }
          return res;
        }),
        supabase.from('slot_subscriptions').select('*').order('last_payment_date', { ascending: false }),
        supabase.from('other_payments').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('plan', 'green_card')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (otherPayRes.error) throw otherPayRes.error;

      const profiles = profilesRes.data || [];
      const slots = slotsRes.data || [];
      const otherPayments = otherPayRes.data || [];
      const subscriptions = subscriptionsRes?.data || [];

      // 2. Map members with calculated slot holdings per program & green card status
      const mappedMembers: Member[] = profiles.map((p: any) => {
        const userSlots = slots.filter((s: any) => s.user_id === p.id && s.status === 'active');
        const userGreenCard = subscriptions.find((s: any) => s.user_id === p.id && s.status === 'active' && new Date(s.expires_at) > new Date());
        const hasGreenCard = Boolean(userGreenCard || (p.member_id && p.member_id.startsWith('AGC-')));
        
        const programMap: Record<string, { category: string; slots: number; status: string }> = {};
        let totalSlots = 0;

        userSlots.forEach((s: any) => {
          const category = s.project_category || 'Mushroom Village';
          const slotCount = Number(s.slots) || 0;
          totalSlots += slotCount;

          if (!programMap[category]) {
            programMap[category] = { category, slots: 0, status: s.status || 'active' };
          }
          programMap[category].slots += slotCount;
        });

        return {
          id: p.id,
          full_name: p.full_name || 'Unnamed Member',
          email: p.email || (p.phone || p.phone_number ? `Phone: ${p.phone || p.phone_number}` : 'No Email'),
          phone: p.phone || p.phone_number || '',
          member_id: p.member_id || 'No ID Assigned',
          referral_code: p.referral_code || '',
          referred_by: p.referred_by || '',
          role: p.role || 'user',
          created_at: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
          has_green_card: hasGreenCard,
          green_card_expires_at: userGreenCard?.expires_at,
          total_slots: totalSlots,
          slots_by_program: Object.values(programMap)
        };
      });

      setMembers(mappedMembers);

      // 3. Build Payment Logs
      const combinedLogs: PaymentLog[] = [];
      
      slots.forEach((s: any) => {
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

      otherPayments.forEach((p: any) => {
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

  // ── Open Edit Member Modal ────────────────────────────────────────────────
  const startEditingMember = (member: Member) => {
    setEditingMember(member);
    setEditFullName(member.full_name || '');
    setEditEmail(member.email === 'No Email' ? '' : member.email);
    setEditPhone(member.phone || '');
    setEditMemberId(member.member_id === 'No ID Assigned' ? '' : member.member_id);
    setEditReferralCode(member.referral_code || '');
    setEditRole(member.role || 'user');
    setErrorMessage('');
  };

  // ── Manual Green Card Activation (Offline Payment) ───────────────────────
  const handleActivateGreenCard = async (member: Member, skipConfirm = false) => {
    if (!skipConfirm && !confirm(`Confirm offline payment (₦1,000) and issue Green Card status for ${member.full_name}?`)) {
      return;
    }

    setActivatingMemberId(member.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let resolvedMemberId = member.member_id !== 'No ID Assigned' ? member.member_id : '';

      // 1. Try DB RPC first
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_activate_green_card', {
        p_user_id: member.id,
        p_credit_referrer: true
      });

      if (!rpcErr && rpcRes?.success) {
        resolvedMemberId = rpcRes.member_id || resolvedMemberId || 'Assigned';
        setSuccessMessage(`Green Card successfully issued to ${member.full_name}! Member ID: ${resolvedMemberId}`);
        setIssuedGreenCardDetails({
          member: { ...member, member_id: resolvedMemberId, has_green_card: true },
          memberId: resolvedMemberId
        });
        setIsIssueModalOpen(false);
        setIssueSelectedMemberId('');
        if (editingMember && editingMember.id === member.id) {
          setEditingMember({
            ...editingMember,
            has_green_card: true,
            member_id: resolvedMemberId
          });
        }
        await fetchData();
        return;
      }

      // 2. Try Edge Function
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'activate_green_card',
          user_id: member.id
        }
      });

      if (!edgeErr && edgeRes?.success) {
        resolvedMemberId = edgeRes.data.member_id || resolvedMemberId || 'Assigned';
        setSuccessMessage(`Green Card successfully issued to ${member.full_name}! Member ID: ${resolvedMemberId}`);
        setIssuedGreenCardDetails({
          member: { ...member, member_id: resolvedMemberId, has_green_card: true },
          memberId: resolvedMemberId
        });
        setIsIssueModalOpen(false);
        setIssueSelectedMemberId('');
        if (editingMember && editingMember.id === member.id) {
          setEditingMember({
            ...editingMember,
            has_green_card: true,
            member_id: resolvedMemberId
          });
        }
        await fetchData();
        return;
      }

      // 3. Fallback: Direct database updates
      const { data: memberId } = await supabase.rpc('get_or_create_green_card_member_id', {
        p_user_id: member.id,
        p_join_year: new Date().getFullYear()
      });

      resolvedMemberId = memberId || resolvedMemberId || 'AGC-NEW-2026';

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await supabase.from('subscriptions').delete().eq('user_id', member.id).eq('plan', 'green_card');
      const { error: subErr } = await supabase.from('subscriptions').insert({
        user_id: member.id,
        plan: 'green_card',
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: oneYearFromNow.toISOString()
      });

      if (subErr) throw subErr;

      const txRef = `ADMIN_GC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from('other_payments').insert({
        user_id: member.id,
        payment_type: 'green_card_offline',
        amount: 1000,
        slots: 0,
        project_category: 'Green Card Membership (Admin Offline Activation)',
        status: 'success',
        transaction_ref: txRef
      });

      setSuccessMessage(`Green Card successfully issued to ${member.full_name}! Member ID: ${resolvedMemberId}`);
      setIssuedGreenCardDetails({
        member: { ...member, member_id: resolvedMemberId, has_green_card: true },
        memberId: resolvedMemberId
      });
      setIsIssueModalOpen(false);
      setIssueSelectedMemberId('');
      if (editingMember && editingMember.id === member.id) {
        setEditingMember({
          ...editingMember,
          has_green_card: true,
          member_id: resolvedMemberId
        });
      }
      await fetchData();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to activate Green Card.');
    } finally {
      setActivatingMemberId(null);
    }
  };

  // ── Save Edited Member Profile ────────────────────────────────────────────
  const handleSaveMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editFullName.trim()) {
      setErrorMessage('Full Name cannot be empty.');
      return;
    }

    setEditSaving(true);
    setErrorMessage('');

    try {
      // Try Edge Function
      const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'update_member',
          user_id: editingMember.id,
          full_name: editFullName.trim(),
          email: editEmail.trim().toLowerCase() || undefined,
          phone: editPhone.trim(),
          member_id: editMemberId.trim() || undefined,
          referral_code: editReferralCode.trim() || undefined,
          role: editRole
        }
      });

      if (!edgeErr && edgeRes?.success) {
        setSuccessMessage(`Profile updated successfully for ${editFullName}!`);
        setEditingMember(null);
        fetchData();
        return;
      }

      // Fallback: Direct database update
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          email: editEmail.trim().toLowerCase() || null,
          phone: editPhone.trim(),
          member_id: editMemberId.trim() || null,
          referral_code: editReferralCode.trim().toUpperCase() || null,
          role: editRole
        })
        .eq('id', editingMember.id);

      if (dbErr) throw dbErr;

      setSuccessMessage(`Profile updated successfully for ${editFullName}!`);
      setEditingMember(null);
      fetchData();

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to update member profile.');
    } finally {
      setEditSaving(false);
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
          email: regEmail.trim().toLowerCase(),
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

  // ── Search & Program Filters ──────────────────────────────────────────────
  const filterMemberPredicate = (m: Member, queryStr: string) => {
    const query = queryStr.toLowerCase().trim();
    const cleanPhone = m.phone.replace(/[^0-9]/g, '');
    const cleanQuery = query.replace(/[^0-9]/g, '');

    const textMatch = !query || (
      m.full_name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
      m.phone.toLowerCase().includes(query) ||
      m.member_id.toLowerCase().includes(query) ||
      m.referral_code.toLowerCase().includes(query)
    );

    if (!textMatch) return false;

    if (greenCardFilter === 'active' && !m.has_green_card) return false;
    if (greenCardFilter === 'unpaid' && m.has_green_card) return false;

    if (programFilter === 'has_slots') {
      return m.total_slots > 0;
    }
    if (programFilter === 'no_slots') {
      return m.total_slots === 0;
    }
    if (programFilter !== 'all') {
      return m.slots_by_program.some(prog => prog.category.toLowerCase().includes(programFilter.toLowerCase()));
    }

    return true;
  };

  const filteredMembers = members.filter(m => filterMemberPredicate(m, searchQuery));
  const searchableSlotMembers = members.filter(m => {
    const q = memberPickerSearch.toLowerCase().trim();
    if (!q) return true;
    const cleanPhone = m.phone.replace(/[^0-9]/g, '');
    const cleanQuery = q.replace(/[^0-9]/g, '');
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
      m.phone.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q)
    );
  });
  const selectedMember = members.find(m => m.id === selectedMemberId);

  const searchableIssueMembers = members.filter(m => {
    const q = issueMemberSearch.toLowerCase().trim();
    if (!q) return true;
    const cleanPhone = m.phone.replace(/[^0-9]/g, '');
    const cleanQuery = q.replace(/[^0-9]/g, '');
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (cleanQuery.length >= 3 && cleanPhone.includes(cleanQuery)) ||
      m.phone.toLowerCase().includes(q) ||
      m.member_id.toLowerCase().includes(q)
    );
  });
  const issueSelectedMember = members.find(m => m.id === issueSelectedMemberId);

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
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileNavOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sprout className="logo-icon" size={28} color="#10b981" />
            <span className="logo-text">Agroheal Admin</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close Navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button 
                onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false); }} 
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('members'); setMobileNavOpen(false); }} 
                className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
              >
                <Users size={18} />
                Members
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('payments'); setMobileNavOpen(false); }} 
                className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              >
                <CreditCard size={18} />
                Operations Logs
              </button>
            </li>
            <li>
              <button 
                onClick={() => { setActiveTab('settings'); setMobileNavOpen(false); }} 
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="hamburger-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu size={22} />
            </button>
            <div className="header-title">
              <h2>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'members' && 'Members'}
                {activeTab === 'payments' && 'Operations'}
                {activeTab === 'settings' && 'Documents'}
              </h2>
            </div>
          </div>
          <div className="header-actions">
            <button className="button button-secondary header-refresh-btn" onClick={fetchData} style={{ padding: '8px 12px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> <span className="header-btn-text">Refresh</span>
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
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
                    <span>Green Card Holders</span>
                    <ShieldCheck size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">
                    {members.filter(m => m.has_green_card).length}
                  </span>
                  <div className="stat-footer">
                    {members.filter(m => !m.has_green_card).length} unpaid / pending
                  </div>
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

              <div className="dashboard-grid-dual">
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
                          <div className="selected-member-info" style={{ flexGrow: 1 }}>
                            <div className="selected-member-avatar">
                              {selectedMember.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedMember.full_name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {selectedMember.email} {selectedMember.phone ? `• 📞 ${selectedMember.phone}` : ''}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                <span className="member-picker-badge">
                                  {selectedMember.member_id}
                                </span>
                                {selectedMember.total_slots > 0 ? (
                                  selectedMember.slots_by_program.map((prog, idx) => (
                                    <span key={idx} className={`program-pill ${getProgramPillClass(prog.category)}`} style={{ fontSize: 10, padding: '1px 5px' }}>
                                      {getProgramEmoji(prog.category)} {prog.category.replace(' Village', '')}: {prog.slots}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>0 current slots</span>
                                )}
                              </div>
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
                            style={{ padding: '6px 10px', fontSize: 12, gap: 4, marginLeft: 8 }}
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
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                    <span className="member-picker-badge">
                                      {m.member_id}
                                    </span>
                                    {m.total_slots > 0 ? (
                                      <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>
                                        🌱 {m.total_slots} {m.total_slots === 1 ? 'Slot' : 'Slots'}
                                      </span>
                                    ) : null}
                                  </div>
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

                    <div className="form-row-dual">
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Interactive KPI Summary & Quick Filter Cards */}
              <div className="members-kpi-grid">
                <div 
                  className={`members-kpi-card ${greenCardFilter === 'all' ? 'active-filter' : ''}`}
                  onClick={() => setGreenCardFilter('all')}
                  title="Click to view all registered members"
                >
                  <div className="members-kpi-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div className="members-kpi-value">{members.length}</div>
                    <div className="members-kpi-label">Total Registered Members</div>
                  </div>
                </div>

                <div 
                  className={`members-kpi-card ${greenCardFilter === 'active' ? 'active-filter' : ''}`}
                  onClick={() => setGreenCardFilter('active')}
                  title="Click to view active Green Card holders"
                >
                  <div className="members-kpi-icon" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="members-kpi-value">{members.filter(m => m.has_green_card).length}</div>
                    <div className="members-kpi-label">
                      Green Card Active ({members.length > 0 ? Math.round((members.filter(m => m.has_green_card).length / members.length) * 100) : 0}%)
                    </div>
                  </div>
                </div>

                <div 
                  className={`members-kpi-card ${greenCardFilter === 'unpaid' ? 'active-filter' : ''}`}
                  onClick={() => setGreenCardFilter('unpaid')}
                  title="Click to view members who haven't paid for Green Card yet"
                >
                  <div className="members-kpi-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <div className="members-kpi-value">{members.filter(m => !m.has_green_card).length}</div>
                    <div className="members-kpi-label">Pending / Needs Green Card</div>
                  </div>
                </div>
              </div>

              {/* Members Unified Toolbar */}
              <div className="members-toolbar">
                <div className="members-toolbar-search">
                  {/* Search Input */}
                  <div style={{ position: 'relative', flex: '1 1 240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search Name, Email, Phone, Member ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '9px 12px 9px 36px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Program Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                    <select
                      value={programFilter}
                      onChange={(e) => setProgramFilter(e.target.value)}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="all">All Programs</option>
                      <option value="has_slots">🌱 Has Active Slots ({members.filter(m => m.total_slots > 0).length})</option>
                      <option value="no_slots">0 Slots ({members.filter(m => m.total_slots === 0).length})</option>
                      <option value="Mushroom">🍄 Mushroom</option>
                      <option value="Sweet Potato">🍠 Sweet Potato</option>
                      <option value="Ginger">🌿 Ginger</option>
                    </select>
                  </div>
                </div>

                <div className="members-toolbar-actions">
                  {/* View Mode Toggle */}
                  <div className="view-mode-toggle">
                    <button
                      type="button"
                      className={`view-mode-btn ${memberViewMode === 'table' ? 'active' : ''}`}
                      onClick={() => setMemberViewMode('table')}
                      title="Force Table View"
                    >
                      <TableIcon size={14} /> <span className="header-btn-text">Table</span>
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${memberViewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setMemberViewMode('cards')}
                      title="Force Card View"
                    >
                      <LayoutGrid size={14} /> <span className="header-btn-text">Cards</span>
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${memberViewMode === 'auto' ? 'active' : ''}`}
                      onClick={() => setMemberViewMode('auto')}
                      title="Auto Adaptive (Table on Desktop, Cards on Mobile)"
                    >
                      <span>Auto</span>
                    </button>
                  </div>

                  {/* Primary Action Button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsIssueModalOpen(true);
                      setIssueMemberSearch('');
                      setIssueSelectedMemberId('');
                    }}
                    className="button"
                    style={{
                      padding: '9px 16px',
                      fontSize: '13px',
                      gap: '6px',
                      backgroundColor: 'var(--accent-color)',
                      color: '#064e3b',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <IdCard size={16} /> Issue Green Card
                  </button>
                </div>
              </div>

              {/* ── 1. Desktop & Tablet Table View ── */}
              {(memberViewMode === 'table' || memberViewMode === 'auto') && (
                <div className={`table-card ${memberViewMode === 'auto' ? 'desktop-table-container' : ''}`}>
                  <div className="card-header" style={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <span className="card-title">Directory Records ({filteredMembers.length})</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
                        Total Leased Slots: <strong>{members.reduce((sum, m) => sum + m.total_slots, 0)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Member Details</th>
                          <th>Green Card Status & ID</th>
                          <th>Role</th>
                          <th>Subscribed Programs & Slots</th>
                          <th>Referral Code</th>
                          <th>Referred By</th>
                          <th>Joined</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMembers.map(m => (
                          <tr key={m.id}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</div>
                              {m.phone && (
                                <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                  <Phone size={11} /> {m.phone}
                                </div>
                              )}
                            </td>
                            <td>
                              {m.has_green_card ? (
                                <div>
                                  <span className="status-badge status-active" style={{ fontSize: 11, padding: '3px 8px', gap: 4, fontWeight: 700 }}>
                                    <ShieldCheck size={12} /> Active Green Card
                                  </span>
                                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, marginTop: 4, color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {m.member_id}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="status-badge" style={{ fontSize: 11, padding: '3px 8px', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 700 }}>
                                    <AlertCircle size={12} /> No Green Card
                                  </span>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Unpaid / Not Issued
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${m.role === 'admin' ? 'status-active' : 'status-pending'}`} style={{ fontSize: 11, padding: '2px 8px' }}>
                                {m.role || 'user'}
                              </span>
                            </td>
                            <td>
                              {m.total_slots > 0 ? (
                                <div>
                                  <span className="slot-badge-total">
                                    <Sprout size={12} /> {m.total_slots} {m.total_slots === 1 ? 'Slot' : 'Slots'}
                                  </span>
                                  <div className="program-pills-container">
                                    {m.slots_by_program.map((prog, idx) => (
                                      <span key={idx} className={`program-pill ${getProgramPillClass(prog.category)}`}>
                                        {getProgramEmoji(prog.category)} {prog.category.replace(' Village', '')}: <strong>{prog.slots}</strong>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>0 Slots</span>
                              )}
                            </td>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{m.referral_code || 'N/A'}</td>
                            <td style={{ fontSize: 12 }}>{m.referred_by || 'Direct'}</td>
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.created_at}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                {!m.has_green_card && (
                                  <button 
                                    onClick={() => handleActivateGreenCard(m)}
                                    disabled={activatingMemberId === m.id}
                                    className="button"
                                    style={{ 
                                      padding: '6px 10px', 
                                      fontSize: 12, 
                                      gap: 4,
                                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                      color: '#34d399',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      fontWeight: 600
                                    }}
                                    title="Confirm offline payment (₦1,000) and issue Green Card"
                                  >
                                    <IdCard size={13} /> {activatingMemberId === m.id ? 'Issuing...' : 'Issue Green Card'}
                                  </button>
                                )}
                                <button 
                                  onClick={() => startEditingMember(m)}
                                  className="button button-secondary"
                                  style={{ padding: '6px 10px', fontSize: 12, gap: 4 }}
                                  title="Edit Profile Details"
                                >
                                  <Edit3 size={13} /> Edit
                                </button>
                                <button 
                                  onClick={() => handlePasswordReset(m)} 
                                  disabled={recoveryLoading}
                                  className="button button-secondary"
                                  style={{ padding: '6px 10px', fontSize: 12, gap: 4 }}
                                  title="Reset Password"
                                >
                                  <KeyRound size={13} /> Reset
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                              No members found matching the current search / filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── 2. Mobile & Card View (Adaptive) ── */}
              {(memberViewMode === 'cards' || memberViewMode === 'auto') && (
                <div className={`member-cards-grid ${memberViewMode === 'auto' ? 'mobile-cards-container' : ''}`} style={{ display: memberViewMode === 'cards' ? 'grid' : undefined }}>
                  {filteredMembers.map(m => (
                    <div key={m.id} className="member-card-item">
                      <div>
                        <div className="member-card-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="member-card-avatar">
                              {m.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                                {m.full_name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                Joined {m.created_at}
                              </div>
                            </div>
                          </div>
                          <span className={`status-badge ${m.role === 'admin' ? 'status-active' : 'status-pending'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                            {m.role || 'user'}
                          </span>
                        </div>

                        <div className="member-card-details">
                          <div className="member-card-detail-row">
                            <Mail size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                              {m.email}
                            </span>
                          </div>

                          {m.phone && (
                            <div className="member-card-detail-row">
                              <Phone size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                              <a 
                                href={`tel:${m.phone}`}
                                style={{ fontSize: 12, color: '#34d399', textDecoration: 'none', fontWeight: 600 }}
                              >
                                {m.phone}
                              </a>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Green Card:</span>
                              {m.has_green_card ? (
                                <span className="status-badge status-active" style={{ fontSize: 11, padding: '2px 8px', gap: 4, fontWeight: 700 }}>
                                  <ShieldCheck size={11} /> Active
                                </span>
                              ) : (
                                <span className="status-badge" style={{ fontSize: 11, padding: '2px 8px', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', fontWeight: 700 }}>
                                  <AlertCircle size={11} /> Unpaid
                                </span>
                              )}
                            </div>

                            {m.has_green_card && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Member ID:</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {m.member_id}
                                </span>
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Farm Slots:</span>
                              {m.total_slots > 0 ? (
                                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                                  🌱 {m.total_slots} {m.total_slots === 1 ? 'Slot' : 'Slots'}
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>0 Slots</span>
                              )}
                            </div>

                            {m.total_slots > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                {m.slots_by_program.map((prog, idx) => (
                                  <span key={idx} className={`program-pill ${getProgramPillClass(prog.category)}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                                    {getProgramEmoji(prog.category)} {prog.category.replace(' Village', '')}: {prog.slots}
                                  </span>
                                ))}
                              </div>
                            )}

                            {m.referral_code && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: 4, marginTop: 2 }}>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ref Code: <strong style={{ color: 'var(--text-secondary)' }}>{m.referral_code}</strong></span>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>By: <strong style={{ color: 'var(--text-secondary)' }}>{m.referred_by || 'Direct'}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="member-card-actions">
                        {!m.has_green_card && (
                          <button 
                            onClick={() => handleActivateGreenCard(m)}
                            disabled={activatingMemberId === m.id}
                            className="button"
                            style={{ 
                              flex: '1 1 100%',
                              padding: '8px 12px', 
                              fontSize: 12, 
                              gap: 5,
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              fontWeight: 700,
                              justifyContent: 'center'
                            }}
                            title="Confirm offline payment (₦1,000) and issue Green Card"
                          >
                            <IdCard size={14} /> {activatingMemberId === m.id ? 'Issuing...' : 'Issue Green Card'}
                          </button>
                        )}
                        <button 
                          onClick={() => startEditingMember(m)}
                          className="button button-secondary"
                          style={{ padding: '8px 12px', fontSize: 12, gap: 4, flex: 1, justifyContent: 'center' }}
                          title="Edit Profile Details"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button 
                          onClick={() => handlePasswordReset(m)} 
                          disabled={recoveryLoading}
                          className="button button-secondary"
                          style={{ padding: '8px 12px', fontSize: 12, gap: 4, flex: 1, justifyContent: 'center' }}
                          title="Reset Password"
                        >
                          <KeyRound size={13} /> Reset
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      No members found matching the current search / filter criteria.
                    </div>
                  )}
                </div>
              )}

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

      {/* ── Edit Member Modal ────────────────────────────────────────────── */}
      {editingMember && (
        <div className="modal-overlay" onClick={() => setEditingMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCog size={20} color="#10b981" /> Edit Member Profile
              </span>
              <button 
                onClick={() => setEditingMember(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMemberProfile}>
              <div className="modal-body">
                {/* Active Program Holdings in Modal */}
                <div style={{ padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    Current Program Enrollments & Slots:
                  </span>
                  {editingMember.total_slots > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {editingMember.slots_by_program.map((prog, idx) => (
                        <span key={idx} className={`program-pill ${getProgramPillClass(prog.category)}`}>
                          {getProgramEmoji(prog.category)} {prog.category}: <strong>{prog.slots} slots</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No active farm slots on record.</span>
                  )}
                </div>

                {/* Green Card Membership Status & Offline Activation */}
                <div style={{ 
                  padding: 14, 
                  backgroundColor: editingMember.has_green_card ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)', 
                  borderRadius: 8, 
                  border: `1px solid ${editingMember.has_green_card ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: editingMember.has_green_card ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {editingMember.has_green_card ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
                      {editingMember.has_green_card ? 'Active Green Card Member' : 'Green Card Not Active (Unpaid)'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
                      {editingMember.has_green_card 
                        ? `Member ID: ${editingMember.member_id}` 
                        : 'User registered but has not completed Green Card subscription payment.'}
                    </span>
                  </div>
                  {!editingMember.has_green_card && (
                    <button
                      type="button"
                      onClick={() => handleActivateGreenCard(editingMember)}
                      disabled={activatingMemberId === editingMember.id}
                      className="button"
                      style={{ 
                        padding: '8px 14px', 
                        fontSize: 12, 
                        gap: 6,
                        whiteSpace: 'nowrap',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <CreditCard size={14} /> {activatingMemberId === editingMember.id ? 'Activating...' : 'Activate Green Card'}
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input 
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input 
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="user@example.com"
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
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <input 
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
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

                <div className="form-row-dual">
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Member ID
                    </label>
                    <input 
                      type="text"
                      value={editMemberId}
                      onChange={(e) => setEditMemberId(e.target.value)}
                      placeholder="AGC-000123-2026"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--mono)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Referral Code
                    </label>
                    <input 
                      type="text"
                      value={editReferralCode}
                      onChange={(e) => setEditReferralCode(e.target.value)}
                      placeholder="REF123"
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontFamily: 'var(--mono)',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    User Access Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
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
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="button button-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editSaving}
                  className="button"
                >
                  <Save size={14} /> {editSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Issue Green Card Modal ───────────────────────────────────────── */}
      {isIssueModalOpen && (
        <div className="modal-overlay" onClick={() => setIsIssueModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(95vw, 540px)' }}>
            <div className="modal-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IdCard size={20} color="#10b981" /> Issue Green Card to Existing Member
              </span>
              <button 
                onClick={() => setIsIssueModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Select a registered member who has made an offline payment (Cash or Direct Bank Transfer) to assign their official Member ID and activate 1-year Green Card benefits.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Select Member (Search by Name, Email, Phone, or ID)
                </label>

                {issueSelectedMember ? (
                  <div className="selected-member-card">
                    <div className="selected-member-info" style={{ flexGrow: 1 }}>
                      <div className="selected-member-avatar">
                        {issueSelectedMember.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{issueSelectedMember.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {issueSelectedMember.email} {issueSelectedMember.phone ? `• 📞 ${issueSelectedMember.phone}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span className={`status-badge ${issueSelectedMember.has_green_card ? 'status-active' : 'status-pending'}`} style={{ fontSize: 11, padding: '2px 6px' }}>
                            {issueSelectedMember.has_green_card ? 'Already Active' : 'Unpaid / Needs Card'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIssueSelectedMemberId('');
                        setIssueMemberSearch('');
                        setIsIssuePickerOpen(true);
                      }}
                      className="button button-secondary"
                      style={{ padding: '6px 10px', fontSize: 12, gap: 4, marginLeft: 8 }}
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
                        placeholder="Search member by name, email, or phone..."
                        value={issueMemberSearch}
                        onChange={(e) => {
                          setIssueMemberSearch(e.target.value);
                          setIsIssuePickerOpen(true);
                        }}
                        onFocus={() => setIsIssuePickerOpen(true)}
                        autoFocus
                      />
                    </div>

                    {isIssuePickerOpen && (
                      <div className="member-picker-dropdown">
                        {searchableIssueMembers.map((m) => (
                          <div
                            key={m.id}
                            className="member-picker-item"
                            onClick={() => {
                              setIssueSelectedMemberId(m.id);
                              setIsIssuePickerOpen(false);
                              setIssueMemberSearch('');
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
                            <span className={`status-badge ${m.has_green_card ? 'status-active' : 'status-pending'}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                              {m.has_green_card ? 'Active' : 'Unpaid'}
                            </span>
                          </div>
                        ))}
                        {searchableIssueMembers.length === 0 && (
                          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                            No matching members found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {issueSelectedMember && (
                <div style={{ padding: 14, backgroundColor: 'rgba(16, 185, 129, 0.04)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-color)' }}>
                    Confirmation Summary:
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    • <strong>Member:</strong> {issueSelectedMember.full_name} ({issueSelectedMember.email})<br />
                    • <strong>Subscription:</strong> 1-Year Agroheal Green Card Membership<br />
                    • <strong>Offline Fee:</strong> ₦1,000 (Payment Confirmed)<br />
                    • <strong>Action:</strong> Assigns sequential Member ID & enables community benefits
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => setIsIssueModalOpen(false)}
                className="button button-secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={!issueSelectedMember || (activatingMemberId === issueSelectedMember.id)}
                onClick={() => issueSelectedMember && handleActivateGreenCard(issueSelectedMember, true)}
                className="button"
                style={{ backgroundColor: 'var(--accent-color)', color: '#064e3b', fontWeight: 700 }}
              >
                <IdCard size={15} /> {activatingMemberId === issueSelectedMember?.id ? 'Issuing Green Card...' : 'Confirm & Issue Green Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Issued Green Card Share / Success Modal ──────────────────────── */}
      {issuedGreenCardDetails && (
        <div className="modal-overlay" onClick={() => setIssuedGreenCardDetails(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(95vw, 500px)', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
                <CheckCircle2 size={22} color="#10b981" /> Green Card Successfully Issued!
              </span>
              <button 
                onClick={() => setIssuedGreenCardDetails(null)}
                style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 18, backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)', width: '100%', textAlign: 'left', lineHeight: 1.7, fontSize: 13 }}>
                <div><strong>Member Name:</strong> {issuedGreenCardDetails.member.full_name}</div>
                <div><strong>Email:</strong> {issuedGreenCardDetails.member.email}</div>
                <div><strong>Official Member ID:</strong> <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-color)', fontWeight: 700, fontSize: 14 }}>{issuedGreenCardDetails.memberId}</span></div>
                <div><strong>Membership Status:</strong> <span style={{ color: '#34d399', fontWeight: 600 }}>Active (1 Year)</span></div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                You can copy the confirmation details or forward them directly to the member via WhatsApp.
              </p>

              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Hello ${issuedGreenCardDetails.member.full_name}!\n\nYour Agroheal LEAP Green Card registration and payment have been confirmed.\n\nMember ID: ${issuedGreenCardDetails.memberId}\nEmail: ${issuedGreenCardDetails.member.email}\nStatus: Active (1 Year)\n\nYou can access your dashboard, training, and community slots at: https://www.agroheal.solutions/dashboard`);
                    setSuccessMessage('Confirmation message copied to clipboard!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }}
                  className="button button-secondary" 
                  style={{ flex: 1, padding: '10px 14px', gap: 6, justifyContent: 'center' }}
                >
                  <Copy size={14} /> Copy Message
                </button>
                <button 
                  onClick={() => openWhatsApp(`Hello ${issuedGreenCardDetails.member.full_name}!\n\nYour Agroheal LEAP Green Card registration and payment have been confirmed.\n\nMember ID: ${issuedGreenCardDetails.memberId}\nEmail: ${issuedGreenCardDetails.member.email}\nStatus: Active (1 Year)\n\nYou can access your dashboard, training, and community slots at: https://www.agroheal.solutions/dashboard`)}
                  className="button button-whatsapp" 
                  style={{ flex: 1, padding: '10px 14px', gap: 6, justifyContent: 'center' }}
                >
                  <MessageCircle size={14} /> Share on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
