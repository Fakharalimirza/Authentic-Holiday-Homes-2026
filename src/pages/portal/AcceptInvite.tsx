import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Key, User, Phone, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { auth, signInWithEmailAndPassword } from '../../lib/firebase';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Invite details from server
  const [inviteDetails, setInviteDetails] = useState<{ email: string; role: string; note?: string } | null>(null);

  // Profile forms state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError("No secure signup invitation token was found in the URL. Please verify your invitations email link.");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/invite/verify?token=${token}`);
        const data = await res.json();

        if (res.status === 444) {
          setError("We couldn't locate this invitation token in our ledger. The token might have expired or been revoked.");
        } else if (!res.ok) {
          setError(data.error || "Failed to verify invitation token authorization.");
        } else {
          setInviteDetails(data.invite);
        }
      } catch (err: any) {
        console.error("Token verification failed:", err);
        setError("Network error validating setup token: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !password) {
      setError("Please fill in your name and set a secure password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password entries.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password,
          displayName: displayName.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Onboarding submission failed.");
      }

      // Successful accept! Automatically sign the user in so the experience is seamless!
      try {
        await signInWithEmailAndPassword(auth, data.email, password);
      } catch (signinErr) {
        console.warn("Auto-signin skipped:", signinErr);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Encountered an error establishing your portal account profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator Portal Access';
      case 'admin': return 'Company Administrator Portal Access';
      case 'host': return 'Host / Landlord Onboarding';
      case 'landlord': return 'Landlord Portal Account Onboarding';
      case 'agent': return 'Agent Portfolio Staff Workspace Access';
      case 'maintenance': return 'Maintenance Field Engineer Access';
      default: return 'Specialist Member Access Onboarding';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6">
        <div className="text-center space-y-3">
          <Loader2 size={36} className="animate-spin text-brand mx-auto" />
          <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">Verifying credential signatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-xl relative overflow-hidden"
      >
        
        {/* Decorative ambient badge */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-xl -translate-y-12 translate-x-12 pointer-events-none" />

        {error ? (
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Invitation Verification Failed</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-405 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 bg-zinc-905 dark:bg-white text-white dark:text-zinc-905 text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-95 transition-all"
            >
              Return Home
            </button>
          </div>
        ) : success ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Onboarding Complete!</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-405 leading-relaxed">
                Your portal profile is successfully compiled and fully authorized! You are now securely logged in.
              </p>
            </div>
            <button
              onClick={() => {
                if (inviteDetails?.role && ['super_admin', 'admin', 'host', 'agent', 'maintenance'].includes(inviteDetails.role)) {
                  navigate('/admin');
                } else {
                  navigate('/profile');
                }
              }}
              className="w-full py-3 bg-brand text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2"
            >
              Go to Workspace Dashboard <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOnboarding} className="space-y-6">
            
            {/* Header */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full mb-3 border border-brand/25">
                <ShieldCheck size={10} /> Secure Registry Invitation
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {inviteDetails ? getRoleTitle(inviteDetails.role) : 'Portal Onboarding'}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Establish your private password and name to finalize authorization credentials.
              </p>
            </div>

            {/* Fields list */}
            <div className="space-y-4">
              
              {/* E-mail (Disabled & Prefilled) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Invited Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="email"
                    disabled
                    value={inviteDetails?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 font-mono outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Name Display */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Full Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fakhar Ali Mirza"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Phone Display */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Phone Contact (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="tel"
                    placeholder="e.g. +971 50 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Set Portal Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Confirm Portal Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="password"
                    required
                    placeholder="Must match password entry"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-zinc-905 dark:bg-white text-white dark:text-zinc-905 text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? <><Loader2 size={13} className="animate-spin" /> Publishing Profile...</> : <>Complete Authorization Registry</>}
            </button>
            
          </form>
        )}

      </motion.div>
    </div>
  );
}
