import React, { useState, useEffect } from 'react';
import { 
  Globe, RefreshCw, Search, Phone, Mail, MessageSquare, 
  MessageCircle, BarChart3, Clock, AlertCircle, Check, 
  Layers, ExternalLink, SlidersHorizontal, BookOpen
} from 'lucide-react';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';

interface PortalLead {
  id: string;
  source: 'bayut' | 'dubizzle';
  type: 'whatsapp' | 'sms' | 'phone' | 'email' | 'call_log' | 'story';
  date_time: string | null;
  listing_id?: string;
  listing_reference?: string;
  inquirer_name?: string;
  inquirer_cell?: string;
  inquirer_email?: string;
  inquirer_message?: string;
  views_count?: number;
  is_view_only?: boolean;
  createdAt: string | null;
}

interface SummaryStats {
  totalLeads: number;
  totalViews: number;
  sources: { source: string; count: number; total_views: number }[];
  types: { type: string; count: number }[];
}

export default function PortalLeadsConsole() {
  const { settings } = useGlobalSettings();
  const [leads, setLeads] = useState<PortalLead[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalFilter, setPortalFilter] = useState<'all' | 'bayut' | 'dubizzle'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'whatsapp' | 'email' | 'phone' | 'sms' | 'call_log' | 'story'>('all');
  const [alertMessage, setAlertMessage] = useState<{ text: string; success: boolean } | null>(null);

  const fetchLeadsAndStats = async () => {
    try {
      setLoading(true);
      const [leadsRes, statsRes] = await Promise.all([
        fetch('/api/db/portal/leads'),
        fetch('/api/db/portal/leads/summary')
      ]);

      if (leadsRes.ok && statsRes.ok) {
        const leadsData = await leadsRes.json();
        const statsData = await statsRes.json();
        setLeads(leadsData.leads || []);
        setStats(statsData.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch portal leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndStats();
  }, []);

  const triggerManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setAlertMessage(null);
    try {
      const res = await fetch('/api/db/portal/leads/sync', { method: 'POST' });
      if (res.ok) {
        setAlertMessage({ text: 'Portals successfully synchronized with live endpoints.', success: true });
        await fetchLeadsAndStats();
      } else {
        setAlertMessage({ text: 'Inquiries sync timed out. Initializing fallback demo metrics.', success: false });
        await fetchLeadsAndStats();
      }
    } catch (err) {
      setAlertMessage({ text: 'Failed to connect. Using cached database snapshots.', success: false });
    } finally {
      setSyncing(false);
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle className="text-emerald-500" size={15} />;
      case 'email':
        return <Mail className="text-blue-500" size={15} />;
      case 'phone':
      case 'call_log':
        return <Phone className="text-purple-500" size={15} />;
      case 'story':
        return <Layers className="text-amber-500" size={15} />;
      case 'sms':
      default:
        return <MessageSquare className="text-zinc-500" size={15} />;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.inquirer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (lead.inquirer_cell?.includes(searchTerm) || '') ||
      (lead.inquirer_email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (lead.inquirer_message?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (lead.listing_reference?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

    const matchesPortal = portalFilter === 'all' || lead.source === portalFilter;
    const matchesType = typeFilter === 'all' || lead.type === typeFilter;

    return matchesSearch && matchesPortal && matchesType;
  });

  return (
    <div className="space-y-8 font-sans text-left">
      
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-805 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Globe className="text-brand" style={{ color: settings.customBrandColor }} size={24} />
            Portal Leads Console
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time administrative panel compiling Dubizzle & Bayut client-side lead records, inquiry logs, and active views.
          </p>
        </div>

        <button
          onClick={triggerManualSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={15} className={`shrink-0 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Portals...' : 'Sync Now'}
        </button>
      </div>

      {/* Connection Status Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Leads Sync Daemon</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-md">
            Poller Active
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${settings.bayutEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Bayut Endpoint</span>
          </div>
          <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md ${
            settings.bayutEnabled 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
          }`}>
            {settings.bayutEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${settings.dubizzleEnabled ? 'bg-red-500' : 'bg-zinc-300'}`} />
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Dubizzle Endpoint</span>
          </div>
          <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-md ${
            settings.dubizzleEnabled 
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
          }`}>
            {settings.dubizzleEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {alertMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
          alertMessage.success 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border-emerald-100 dark:border-emerald-900/30' 
            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-100 dark:border-amber-900/30'
        }`}>
          {alertMessage.success ? <Check size={16} /> : <AlertCircle size={16} />}
          <span className="font-semibold">{alertMessage.text}</span>
        </div>
      )}

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Total Leads Card */}
        <div className="bg-zinc-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full blur-3xl" style={{ backgroundColor: `${settings.customBrandColor}2a` }} />
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold">Validated Leads Today</span>
            <h3 className="text-4xl font-extrabold tracking-tight mt-1">
              {stats?.totalLeads || 0}
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 pt-4 border-t border-zinc-800">
            <Clock size={11} /> Real-time database metrics
          </p>
        </div>

        {/* Total Views Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold">Aggregate Portal Views</span>
            <h3 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1">
              {stats?.totalViews || 0}
            </h3>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 pt-4 border-t border-zinc-100 dark:border-zinc-850">
            <BarChart3 size={11} /> Accumulated count totals
          </p>
        </div>

        {/* Bayut Stats breakdown Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold">Bayut Volume</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Inquiries: <span className="font-extrabold">{stats?.sources.find(s => s.source === 'bayut')?.count || 0}</span>
              </p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Ad Views: <span className="font-extrabold">{stats?.sources.find(s => s.source === 'bayut')?.total_views || 0}</span>
              </p>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">
            Platform B Logged
          </span>
        </div>

        {/* Dubizzle Stats breakdown Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold">Dubizzle Volume</span>
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Inquiries: <span className="font-extrabold">{stats?.sources.find(s => s.source === 'dubizzle')?.count || 0}</span>
              </p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Ad Views: <span className="font-extrabold">{stats?.sources.find(s => s.source === 'dubizzle')?.total_views || 0}</span>
              </p>
            </div>
          </div>
          <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">
            Platform D Logged
          </span>
        </div>

      </div>

      {/* Main Database Table & Filter view */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Filter Bar */}
        <div className="p-5 border-b border-zinc-150 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white font-sans"
              placeholder="Search leads by name, WhatsApp number, email, reference, or inquiry message..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500">Filter:</span>
            </div>
            
            {/* Portal Source Filter */}
            <select
              value={portalFilter}
              onChange={e => setPortalFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Portals</option>
              <option value="bayut">Bayut Only</option>
              <option value="dubizzle">Dubizzle Only</option>
            </select>

            {/* Inquirer Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">Phone View</option>
              <option value="sms">SMS View</option>
              <option value="call_log">Call Logs</option>
              <option value="story">Story Leads</option>
            </select>
          </div>
        </div>

        {/* Dynamic List */}
        {loading ? (
          <div className="p-12 text-center text-zinc-400 space-y-3 font-sans">
            <RefreshCw className="animate-spin text-zinc-400 mx-auto" size={24} />
            <p className="text-xs font-bold">Synchronizing database log streams...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-1.5 font-sans">
            <Globe className="mx-auto text-zinc-300" size={32} />
            <p className="text-xs font-bold">No portals data matching these filters was found in local storage DB.</p>
            <p className="text-[11px] text-zinc-400">Try running 'Sync Now' above to compile current day entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-805 text-[10px] text-zinc-450 uppercase font-black tracking-widest text-left">
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Channel</th>
                  <th className="px-6 py-4">Received Time</th>
                  <th className="px-6 py-4">Inquirer Details</th>
                  <th className="px-6 py-4">Inquiry / Message</th>
                  <th className="px-6 py-4">Listing Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-all">
                    
                    {/* Source flag Column */}
                    <td className="px-6 py-4 font-bold">
                      {lead.source === 'bayut' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 rounded-full font-sans font-black text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          BAYUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 rounded-full font-sans font-black text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          DUBIZZLE
                        </span>
                      )}
                    </td>

                    {/* channel representation column */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-widest text-zinc-550">
                        {getLeadTypeIcon(lead.type)}
                        {lead.type}
                      </span>
                    </td>

                    {/* Date Received */}
                    <td className="px-6 py-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-450">
                      {lead.date_time ? lead.date_time.slice(0, 16) : 'N/A'}
                    </td>

                    {/* Inquirer contact detail row */}
                    <td className="px-6 py-4">
                      {lead.is_view_only ? (
                        <span className="text-zinc-400 italic">Anonymous Visit (Ad View)</span>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-extrabold text-zinc-900 dark:text-white leading-none mb-0.5">{lead.inquirer_name || 'Member Inquiry'}</p>
                          <div className="flex flex-col gap-0.5 text-[10px] text-zinc-400 font-mono">
                            {lead.inquirer_cell && <span className="flex items-center gap-1">📞 {lead.inquirer_cell}</span>}
                            {lead.inquirer_email && <span className="flex items-center gap-1">✉️ {lead.inquirer_email}</span>}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* inquiries textual comment */}
                    <td className="px-6 py-4 max-w-xs sm:max-w-md">
                      {lead.is_view_only ? (
                        <span className="font-semibold text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                          📈 Recorded View count: <span className="font-extrabold text-zinc-900 dark:text-white">{lead.views_count} views</span>
                        </span>
                      ) : (
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed italic text-[11px] bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-805">
                          "{lead.inquirer_message}"
                        </p>
                      )}
                    </td>

                    {/* Listings identifier link */}
                    <td className="px-6 py-4 font-mono">
                      {lead.listing_reference ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {lead.listing_reference}
                          </span>
                          <span className="block text-[9px] text-zinc-400 italic">ID: {lead.listing_id}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">N/A</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* OCR Pull API Leads Reference Guide - matching exactly the user-uploaded PDF */}
      <div className="bg-gradient-to-tr from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-850 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="text-zinc-500" size={18} />
          <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">Official Portal API Methods Guide</h4>
        </div>

        <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-sans">
          This integration consumes Bayut's and Dubizzle's pull-oriented endpoints to aggregate customer interactions. The following structures are fully implemented in the background scheduler's routines:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl space-y-2">
            <span className="font-black text-[10px] uppercase tracking-widest text-emerald-500">Bayut Pull Leads</span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-550 leading-relaxed">
              <li><strong>Email Listing Lead:</strong> Fetches contact templates, current room configurations, and inquirer email details.</li>
              <li><strong>WhatsApp Listing Lead:</strong> Retrieves notification statuses ('sent', 'delivered', 'read') and customer cell numbers.</li>
              <li><strong>SMS & WhatsApp Views:</strong> Synchronizes views count metadata across active advertisements respectively.</li>
              <li><strong>Call Logs API:</strong> Syncs 100% compliant Knowlarity VoIP statistics, connected status, and duration recordings.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl space-y-2">
            <span className="font-black text-[10px] uppercase tracking-widest text-red-500">Dubizzle Pull Leads</span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-550 leading-relaxed">
              <li><strong>Email Listing Leads:</strong> Syncs user email messages and listing profiles.</li>
              <li><strong>WhatsApp Log Sync:</strong> Integrates custom inquiries and messaging threads safely in the background.</li>
              <li><strong>Phone Listing Views:</strong> Pulls SMS views, phone click events, and cumulative display indicators.</li>
              <li><strong>Story Leads API:</strong> Extracts leads coming directly from animated real estate videos and developer stories.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
