import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sprout, Lock, Mail, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Authentication succeeded but no user returned.');

      // 2. Verify admin role in profiles table
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileErr) {
        console.warn('Could not verify profile role:', profileErr);
      }

      // If role is explicitly not admin, deny access
      if (profile && profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Your account does not have administrator privileges.');
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Sprout size={32} color="#10b981" />
          </div>
          <h1 className="login-title">Agroheal Admin</h1>
          <p className="login-subtitle">Sign in to manage members, slots, and platform operations.</p>
        </div>

        {errorMessage && (
          <div className="login-error">
            {errorMessage.includes('Access Denied') ? (
              <ShieldAlert size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="admin@agroheal.solutions"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                Sign In to Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>Protected Administrator Portal</span>
        </div>
      </div>
    </div>
  );
}
