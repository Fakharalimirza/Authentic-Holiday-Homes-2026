import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { Mail, Shield, Plus, Lock, Check, AlertCircle, Loader2, Copy, Trash2, Calendar, UserCheck, RefreshCw } from 'lucide-react';

interface Invitation {
  token: string;
  email: string;
  role: string;
  note?: string;
  status: string; // 'pending' | 'accepted'
  invitedByEmail: string;
  createdAt: string;
  acceptedAt?: string;
}

export default function InvitationsConsole() {
  const { profile } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('landlord');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedLink, setCopiedLink] = useState('');

  const fetchInvitations = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Could not acquire credentials token.");

      const res = await fetch('/api/admin/invitations', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch invitations roster");
      }

      const data = await res.json();
      setInvites(data.invites || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not retrieve current invitations list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !role) {
      setErrorMsg("Please fill out the email address and select a portal role.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setGeneratedLink('');

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Could not authenticate administrative token");

      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
          note: note.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to establish invitation code.");
      }

      // Format complete deployment invitation acceptance URL
      const appUrl = window.location.origin;
      const completeLink = `${appUrl}/accept-invite?token=${data.token}`;

      setGeneratedLink(completeLink);
      setSuccessMsg(`Onboarding code successfully compiled for ${email}!`);
      
      // Clear fields
      setEmail('');
      setNote('');
      
      // Refresh list
      fetchInvitations();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Encountered an error publishing the invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (token: string, inviteeEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke the invite for "${inviteeEmail}"?`)) {
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Could not retrieve credentials");

      const res = await fetch(`/api/admin/invitations/${token}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke invitation");
      }

      alert("Onboarding invitation revoked and deactivated successfully!");
      fetchInvitations();
    } catch (err: any) {
      console.error(err);
      alert("Encountered an issue revoking invitation: " + err.message);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => {
      setCopiedLink('');
    }, 2000);
  };

  const formatRole = (r: string) => {
    return r.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
          <Mail className="text-brand shrink-0" size={19} /> Restricted Role Invitations Workspace
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Only users assigned via manual invite tokens can register as Landlords, Admins, or Staff. Normal signups are restricted to Guests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreateInvitation} className="bg-zinc-50 dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-805 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-805 pb-2">
              <Plus size={14} className="text-brand" /> Issue New Portal Invite
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Invitee Email address</label>
              <input
                type="email"
                required
                placeholder="e.g. landlord@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-brand outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Assigned Profile Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-905 dark:text-white"
              >
                <option value="landlord">Landlord (Asset Owner)</option>
                <option value="agent">Agent / Staff Operator</option>
                <option value="maintenance">Maintenance Engineer</option>
                <option value="admin">Administrator</option>
                <option value="super_admin">Super Administrator</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Private Admin Memo / Note</label>
              <textarea
                placeholder="Internal references (e.g. Landlord of Marina Gate 12)"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-brand outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs flex items-center gap-1.5 font-mono">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-600 rounded-xl text-xs flex items-center gap-1.5 font-sans">
                <Check size={14} /> {successMsg}
              </div>
            )}

            {generatedLink && (
              <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Secure Acceptance Link Generated:</p>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 p-2 rounded-lg border border-zinc-150 dark:border-zinc-800">
                  <p className="text-[9px] font-mono break-all text-zinc-600 dark:text-zinc-400 select-all truncate max-w-[150px] md:max-w-none">{generatedLink}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedLink)}
                    className="p-1.5 bg-brand text-white rounded hover:bg-brand-hover shrink-0"
                    title="Copy acceptance URL"
                  >
                    {copiedLink === generatedLink ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-450 italic">Copy and share this onboarding URL directly with the invitee.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-905 dark:bg-white text-white dark:text-zinc-905 text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><Loader2 size={12} className="animate-spin" /> Issuing...</> : <><Lock size={12} /> Dispatch Invite</>}
            </button>
          </form>
        </div>

        {/* Right Side: Roster list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-550 dark:text-zinc-450">Active / Historical Invitations</h3>
            <button
              onClick={fetchInvitations}
              className="p-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1"
            >
              <RefreshCw size={9} /> Sync
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center animate-pulse text-zinc-400 text-xs font-mono">
              <Loader2 size={16} className="animate-spin inline mr-1" /> Retrieving active invitations trail...
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-16 bg-zinc-55/10 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6">
              <Lock size={28} className="mx-auto text-zinc-350 dark:text-zinc-650 mb-2" />
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">No invitations issued yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-auto text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905">
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Invitee / Recipient</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Target Role</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Dispatch Details</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Status</th>
                      <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((inv) => {
                      const shareLink = `${window.location.origin}/accept-invite?token=${inv.token}`;
                      const isPending = inv.status === 'pending';

                      return (
                        <tr key={inv.token} className="border-b border-zinc-100 dark:border-zinc-805 hover:bg-zinc-50/50 dark:hover:bg-zinc-805/30 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-zinc-900 dark:text-white">{inv.email}</div>
                            {inv.note && <div className="text-[10px] text-zinc-405 italic mt-0.5">Memo: {inv.note}</div>}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-405 border rounded border-zinc-200 dark:border-zinc-700">
                              {formatRole(inv.role)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="text-[10px] text-zinc-500">By: {inv.invitedByEmail}</div>
                            <div className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={10} /> {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                              isPending
                                ? 'bg-amber-100 text-amber-805 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-805 dark:bg-emerald-950/20 dark:text-emerald-400'
                            }`}>
                              {isPending ? 'Pending Onboarding' : <><UserCheck size={9} /> Onboarded</>}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isPending && (
                                <button
                                  onClick={() => handleCopyLink(shareLink)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    copiedLink === shareLink 
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-230' 
                                      : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-550 border-zinc-200 dark:border-zinc-700 hover:text-brand'
                                  }`}
                                  title="Copy registration links"
                                >
                                  <Copy size={11} />
                                </button>
                              )}
                              <button
                                onClick={() => handleRevoke(inv.token, inv.email)}
                                className="p-1.5 bg-zinc-50 dark:bg-zinc-800 text-red-500 border border-zinc-230 dark:border-zinc-700 rounded-lg hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all"
                                title="Revoke Invitation"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
