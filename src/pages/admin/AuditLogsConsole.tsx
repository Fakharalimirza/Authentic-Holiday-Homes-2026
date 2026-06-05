import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { Clipboard, ShieldCheck, Search, Filter, RefreshCw, Calendar, Globe, Monitor, User, Loader2 } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  details: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}

export default function AuditLogsConsole() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Credentials token could not be fetched.");

      const res = await fetch('/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load audit trail system catalog");
      }

      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400';
      case 'LOGOUT': return 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-800/20 dark:text-zinc-400';
      case 'SIGN_UP':
      case 'INVITE_ACCEPTED': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'CREATE_PROPERTY':
      case 'UPLOAD_DOCUMENT': return 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400';
      case 'DELETE_PROPERTY':
      case 'REVOKE_INVITE':
      case 'DELETE_DOCUMENT': return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400';
      case 'SEND_INVITE': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400';
      default: return 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300';
      case 'admin': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      case 'host': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'agent': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      case 'maintenance': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  const actionsSet = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search);

    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesRole = filterRole === 'ALL' || log.userRole === filterRole;

    return matchesSearch && matchesAction && matchesRole;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAction, filterRole, logs.length]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1 tracking-tight flex items-center gap-2">
            <Clipboard className="text-brand shrink-0" size={19} /> Live Audit Trail logs
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Secure ledger recording staff actions, listing updates, logins, logouts, access IP coordinates and device user-agents for administrative accountability.
          </p>
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2 text-xs font-black uppercase tracking-widest bg-zinc-105 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white rounded-xl hover:bg-zinc-50 flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Sync Ledger
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-zinc-50 dark:bg-zinc-905 border border-zinc-200 dark:border-zinc-805 rounded-xl p-4 gap-4 grid grid-cols-1 md:grid-cols-4 items-center">
        
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
          <input
            type="text"
            placeholder="Search action logs, emails, details, IP coordinates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand text-zinc-900 dark:text-white"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-lg text-xs text-zinc-900 dark:text-white"
          >
            <option value="ALL">All Actions</option>
            {actionsSet.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-lg text-xs text-zinc-900 dark:text-white"
          >
            <option value="ALL">All Member Roles</option>
            <option value="super_admin">SUPER_ADMIN</option>
            <option value="admin">ADMIN</option>
            <option value="host">HOST (Landlord-Partner)</option>
            <option value="agent">AGENT (Portfolio staff)</option>
            <option value="maintenance">MAINTENANCE (Field engineer)</option>
            <option value="guest">GUEST (Tenant)</option>
          </select>
        </div>

      </div>

      {/* Logs Table / Roster */}
      {loading ? (
        <div className="py-20 text-center animate-pulse text-zinc-400 text-xs font-mono">
          <Loader2 size={20} className="animate-spin inline mr-1 text-brand" /> Querying secure firestore activity repository...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-16 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
          No audit log tracks match your query parameter filters
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto text-xs">
              <thead>
                <tr className="border-b border-zinc-250 dark:border-zinc-800 bg-zinc-55/40 dark:bg-zinc-905">
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Timestamp</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Action Code</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Identity / Role</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Activity Context Description</th>
                  <th className="p-3 text-[10px] font-black uppercase tracking-widest text-zinc-450 dark:text-zinc-400">Client Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805">
                {paginatedLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-805/30 transition-colors">
                      <td className="p-3 whitespace-nowrap text-zinc-500 dark:text-zinc-405 font-mono text-[10px] flex flex-col">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'Pending'}
                        </span>
                        <span className="text-[9px] text-zinc-400 ml-3.5 mt-0.5">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </td>
                      
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block text-[9px] font-mono font-black tracking-wider px-2 py-0.5 border rounded-md uppercase ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User size={10} className="text-zinc-400" />
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-205">{log.userEmail}</span>
                            <div className="mt-0.5">
                              <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${getRoleBadgeColor(log.userRole)}`}>
                                {log.userRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-zinc-700 dark:text-zinc-300">
                        <p className="max-w-[320px] md:max-w-[480px] break-words text-xs leading-relaxed">{log.details}</p>
                      </td>

                      <td className="p-3 text-[10px] text-zinc-500 space-y-0.5">
                        <div className="flex items-center gap-1 font-mono text-[9px]">
                          <Globe size={10} className="text-zinc-400" /> {log.ip}
                        </div>
                        <div className="flex items-center gap-1 text-[8px] text-zinc-405 truncate max-w-[150px]" title={log.userAgent}>
                          <Monitor size={10} className="text-zinc-400 shrink-0" /> {log.userAgent}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <span className="text-[10px] sm:text-xs text-zinc-500 font-medium font-sans uppercase tracking-wider">
                Showing <strong className="text-zinc-800 dark:text-zinc-200">{startIndex + 1}</strong> to{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  {Math.min(startIndex + itemsPerPage, filteredLogs.length)}
                </strong>{" "}
                of <strong className="text-zinc-800 dark:text-zinc-200">{filteredLogs.length}</strong> Audit Logs
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-brand text-white font-black"
                        : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold tracking-widest text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
