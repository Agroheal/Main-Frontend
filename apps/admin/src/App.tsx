import { useState } from 'react';
import './App.css';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  Sprout, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  DollarSign, 
  AlertCircle
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  joined: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'Yearly Premium' | 'Free Tier';
  earnings: string;
}

interface Payment {
  id: string;
  user: string;
  amount: string;
  gateway: 'Paystack' | 'Flutterwave';
  status: 'active' | 'pending' | 'suspended';
  date: string;
  ref: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members' | 'payments' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data simulating Supabase inputs
  const members: Member[] = [
    { id: '1', name: 'Adebayo Johnson', email: 'adebayo.j@gmail.com', joined: '2026-08-15', status: 'active', plan: 'Yearly Premium', earnings: '₦45,000' },
    { id: '2', name: 'Chidi Okafor', email: 'chidi.okafor@outlook.com', joined: '2026-08-12', status: 'active', plan: 'Yearly Premium', earnings: '₦15,000' },
    { id: '3', name: 'Fatima Musa', email: 'fatima.m@yahoo.com', joined: '2026-08-10', status: 'pending', plan: 'Free Tier', earnings: '₦0' },
    { id: '4', name: 'Olumide Bakare', email: 'olumide.b@agroheal.com', joined: '2026-08-05', status: 'suspended', plan: 'Yearly Premium', earnings: '₦30,000' },
    { id: '5', name: 'Grace Effiong', email: 'grace.effiong@gmail.com', joined: '2026-08-01', status: 'active', plan: 'Yearly Premium', earnings: '₦60,000' },
  ];

  const payments: Payment[] = [
    { id: 'TXN-9021', user: 'grace.effiong@gmail.com', amount: '₦25,000', gateway: 'Paystack', status: 'active', date: '2026-08-20 08:32', ref: 'pstk_82937102' },
    { id: 'TXN-9020', user: 'adebayo.j@gmail.com', amount: '₦25,000', gateway: 'Paystack', status: 'active', date: '2026-08-19 14:15', ref: 'pstk_73849102' },
    { id: 'TXN-9019', user: 'chidi.okafor@outlook.com', amount: '₦25,000', gateway: 'Flutterwave', status: 'active', date: '2026-08-19 11:02', ref: 'flw_92019382' },
    { id: 'TXN-9018', user: 'fatima.m@yahoo.com', amount: '₦0', gateway: 'Paystack', status: 'pending', date: '2026-08-18 16:45', ref: 'pstk_11928374' },
  ];

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span>Total Subscriptions</span>
                    <TrendingUp size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">1,482</span>
                  <div className="stat-footer">
                    <span className="stat-trend-up">+12.5%</span> since last month
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Active Premium Members</span>
                    <Users size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">843</span>
                  <div className="stat-footer">
                    <span className="stat-trend-up">+8.2%</span> since last week
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Gross Revenue</span>
                    <DollarSign size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">₦21.05M</span>
                  <div className="stat-footer">
                    <span className="stat-trend-up">+18.4%</span> since last month
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Active Referrals</span>
                    <ArrowUpRight size={16} color="#10b981" />
                  </div>
                  <span className="stat-value">312</span>
                  <div className="stat-footer">
                    <span className="stat-trend-up">+4.1%</span> since yesterday
                  </div>
                </div>
              </div>

              {/* Table Card (Recent Members) */}
              <div className="table-card">
                <div className="card-header">
                  <span className="card-title">Recent Membership Signups</span>
                  <button className="button" onClick={() => setActiveTab('members')}>
                    View All Members
                  </button>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Date Joined</th>
                        <th>Plan Option</th>
                        <th>Referral Earnings</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.slice(0, 3).map(m => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</div>
                          </td>
                          <td>{m.joined}</td>
                          <td>{m.plan}</td>
                          <td>{m.earnings}</td>
                          <td>
                            <span className={`status-badge status-${m.status}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="table-card">
              <div className="card-header" style={{ flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
                <span className="card-title">All Members ({filteredMembers.length})</span>
                <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', maxWidth: '400px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search member name or email..."
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
                      <th>Member</th>
                      <th>Joined</th>
                      <th>Plan</th>
                      <th>Referrals</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.email}</div>
                        </td>
                        <td>{m.joined}</td>
                        <td>{m.plan}</td>
                        <td>{m.earnings}</td>
                        <td>
                          <span className={`status-badge status-${m.status}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="table-card">
              <div className="card-header">
                <span className="card-title">Recent Transactions & Verification Checks</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="status-badge status-active" style={{ gap: 4 }}>
                    <ShieldCheck size={12} /> Paystack Active
                  </span>
                  <span className="status-badge status-active" style={{ gap: 4 }}>
                    <ShieldCheck size={12} /> Flutterwave Active
                  </span>
                </div>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TXN Ref</th>
                      <th>Customer Email</th>
                      <th>Payment Amount</th>
                      <th>Gateway</th>
                      <th>Transaction Date</th>
                      <th>Gateway Ref</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{p.id}</td>
                        <td>{p.user}</td>
                        <td>{p.amount}</td>
                        <td>{p.gateway}</td>
                        <td>{p.date}</td>
                        <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-secondary)' }}>{p.ref}</td>
                        <td>
                          <span className={`status-badge status-${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
                  <SettingsIcon size={18} color="#10b981" /> Gateways Setup
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Paystack API Key</label>
                    <input 
                      type="password" 
                      value="••••••••••••••••••••••••••••••••" 
                      disabled
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Flutterwave Secret Hash</label>
                    <input 
                      type="password" 
                      value="••••••••••••••••••••••••" 
                      disabled
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <button className="button" style={{ width: '100%', justifyContent: 'center' }}>
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color="#f59e0b" /> Sync & Database Actions
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Run manual jobs to synchronize Paystack subscriptions, verify payment webhooks, or process monthly overdue slot rentals.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <button className="button button-secondary" style={{ justifyContent: 'center' }}>
                    Sync Subscriptions Job
                  </button>
                  <button className="button button-secondary" style={{ justifyContent: 'center' }}>
                    Process Overdue Slots Job
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
