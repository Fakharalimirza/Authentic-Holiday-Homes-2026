import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  RefreshCw, 
  ShieldAlert, 
  Terminal, 
  BookOpen, 
  AlertTriangle,
  HardDrive,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { socket } from '../../lib/mysql-adapter';

interface DbStatus {
  active: boolean;
  dbError?: string | null;
  ftpActive: boolean;
  ftpError?: string | null;
  outboundIp?: string;
  config: {
    host: string;
    database: string;
    user: string;
    port: string;
  };
}

export default function DatabaseConsole() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Realtime diagnostic test states
  const [socketStatus, setSocketStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [socketLatency, setSocketLatency] = useState<number | null>(null);
  const [socketTransport, setSocketTransport] = useState<string | null>(null);
  const [socketTimestamp, setSocketTimestamp] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);

  const runRealtimeTest = () => {
    setSocketStatus('testing');
    setSocketError(null);
    setSocketLatency(null);
    setSocketTransport(null);
    setSocketTimestamp(null);

    const startTime = Date.now();
    
    // Set 5 seconds safety timeout
    const timeoutId = setTimeout(() => {
      socket.off("realtime_test_pong", handlePong);
      setSocketStatus('failed');
      setSocketError("Ping timed out. Socket server is unreachable or slow.");
      console.error("[Socket.io Self Test] Error: Timeout. Socket response took longer than 5 seconds.");
    }, 5000);

    const handlePong = (payload: any) => {
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const diffEnd = endTime - startTime;
      
      setSocketLatency(diffEnd);
      setSocketStatus('connected');
      setSocketTransport(payload?.transport || 'websocket');
      setSocketTimestamp(new Date().toLocaleTimeString());
      setSocketError(null);
      console.log(`[Socket.io Self Test] Success. Latency: ${diffEnd}ms. Transport: ${payload?.transport || 'unknown'}`);
    };

    socket.once("realtime_test_pong", handlePong);
    
    // Trigger emit over socket.io connection
    socket.emit("realtime_test_ping", { timestamp: startTime });
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/db/status');
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data);
      } else {
        throw new Error(data.error || "Failed to retrieve core system infrastructure statuses.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while pinging local service adapters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Determine if there is any connection error requiring soft warning banners list
  const hasInfrastructureErrors = dbStatus && (!dbStatus.active || !dbStatus.ftpActive);

  return (
    <div className="space-y-6">
      
      {/* Banner/Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-brand/5 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand text-[9px] font-black uppercase tracking-widest rounded-full border border-brand/25">
            <Cpu size={10} /> Live Infrastructure Manager
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">cPanel Connection Hub</h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-450 max-w-[550px] leading-relaxed">
            Monitor, ping and authenticate your unified cPanel SQL backend and VPS FTP file repository in real time. We have eliminated external Cloud Storage fallback systems completely.
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-750 dark:text-zinc-250 flex items-center gap-1.5 transition-all self-start md:self-auto disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-brand" : ""} /> Test Connection Statuses
        </button>
      </div>

      {/* Connection Failure Alert Banners - Soft Warning Prompts */}
      {hasInfrastructureErrors && (
        <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-250/25 text-amber-900 dark:text-amber-450 p-6 rounded-[2rem] flex flex-col md:flex-row items-start gap-4 shadow-sm">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/50 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle size={24} className="animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-black uppercase tracking-wider">System Attention Required</h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
              One or more core services could not authenticate with cPanel. File uploads, secured documents or db transactions might fail. Please cross-reference your environment secrets, cPanel Remote MySQL Access permissions, and inbound FTP security rules list.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Diagnostics Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-12 text-center text-xs text-zinc-400 font-mono tracking-widest uppercase flex flex-col items-center justify-center gap-4">
              <RefreshCw size={24} className="animate-spin text-brand" /> 
              <span>Pinging cPanel database & FTP server controllers...</span>
            </div>
          ) : dbStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* cPanel MySQL database checker */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Database size={15} className="text-brand" /> MySQL Database
                  </h3>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                    dbStatus.active ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}>
                    {dbStatus.active ? "Online" : "Offline"}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  dbStatus.active 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-250/10 text-emerald-800 dark:text-emerald-400' 
                    : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-250/10 text-rose-800 dark:text-rose-450'
                }`}>
                  <div className="space-y-1.5">
                    <strong className="block text-[10px] uppercase font-bold tracking-wider">MySQL Service State</strong>
                    <p className="text-[10px] leading-relaxed opacity-85">
                      {dbStatus.active 
                        ? 'Successfully connected! Client properties, turnovers, messages and logs are active.' 
                        : 'Database connection failed. Please adjust DB_HOST, DB_NAME, DB_USER parameters.'}
                    </p>
                    {!dbStatus.active && dbStatus.dbError && (
                      <div className="text-[9px] bg-rose-100/40 dark:bg-rose-950/20 border border-rose-200/40 p-2.5 rounded-xl font-mono text-rose-900 dark:text-rose-300 break-all select-all mt-2">
                        {dbStatus.dbError}
                      </div>
                    )}
                  </div>
                </div>

                {/* DB Parameters list */}
                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">Server Host</span>
                    <span className="text-zinc-900 dark:text-white font-black">{dbStatus.config.host || "None"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">Database Schema</span>
                    <span>{dbStatus.config.database || "None"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">SQL User</span>
                    <span>{dbStatus.config.user || "None"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-400">Server Port</span>
                    <span>{dbStatus.config.port || "3306"}</span>
                  </div>
                </div>
              </div>

              {/* cPanel FTP Storage Checker */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <HardDrive size={15} className="text-brand" /> FTP Media Storage
                  </h3>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                    dbStatus.ftpActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {dbStatus.ftpActive ? "Online" : "Needs Attention"}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  dbStatus.ftpActive 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-250/10 text-emerald-800 dark:text-emerald-400' 
                    : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-250/10 text-amber-800 dark:text-amber-450'
                }`}>
                  <div className="space-y-1.5">
                    <strong className="block text-[10px] uppercase font-bold tracking-wider">FTP Repository State</strong>
                    <p className="text-[10px] leading-relaxed opacity-85">
                      {dbStatus.ftpActive 
                        ? 'Operational! Image uploads, turnovers and secure PDFs write directly via FTP parameters.' 
                        : 'FTP server unreachable. Cross-reference host domain, ports, and VPN firewalls.'}
                    </p>
                    {!dbStatus.ftpActive && dbStatus.ftpError && (
                      <div className="text-[9px] bg-amber-100/40 dark:bg-amber-950/20 border border-amber-250/30 p-2.5 rounded-xl font-mono text-amber-900 dark:text-amber-300 break-all select-all mt-2">
                        {dbStatus.ftpError}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">FTP Storage Host</span>
                    <span className="text-zinc-900 dark:text-white font-black">{process.env.VPS_FTP_HOST || "Not Set"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">FTP Auth User</span>
                    <span>{process.env.VPS_FTP_USER || "Not Set"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <span className="font-bold text-zinc-400">Base FTP Dir</span>
                    <span>{process.env.VPS_FTP_REMOTE_DIR || "public_html/uploads"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-400">FTP Secure TLS</span>
                    <span>{process.env.VPS_FTP_SECURE === "true" ? "Yes (Secure)" : "No (Plain)"}</span>
                  </div>
                </div>
              </div>

              {/* Socket.io Realtime Connection self-test */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-5 md:col-span-2 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-850">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Wifi size={15} className="text-brand animate-pulse" /> Socket.io Realtime Link Test
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Check if bi-directional Socket.io WSS or polling connections are fully operational with the server.
                    </p>
                  </div>
                  
                  <button
                    onClick={runRealtimeTest}
                    disabled={socketStatus === 'testing'}
                    className="px-4 py-2.5 bg-brand hover:brightness-105 active:scale-[0.98] transition-all rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 cursor-pointer shadow-md shadow-brand/10 shrink-0"
                    style={{ backgroundColor: dbStatus?.config?.host ? undefined : '#4f46e5' }} // brand color fallback
                  >
                    <Activity size={14} className={socketStatus === 'testing' ? 'animate-pulse' : ''} />
                    {socketStatus === 'testing' ? 'Pinging Gateway...' : 'Run Realtime Ping Test'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Status Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Connection State</span>
                    <div className="flex items-center gap-1.5">
                      {socketStatus === 'idle' && (
                        <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-widest rounded-full">
                          Not Tested
                        </span>
                      )}
                      {socketStatus === 'testing' && (
                        <span className="px-2.5 py-1 bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-extrabold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping" />
                          Testing...
                        </span>
                      )}
                      {socketStatus === 'connected' && (
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-extrabold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Connected
                        </span>
                      )}
                      {socketStatus === 'failed' && (
                        <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-900 font-extrabold text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Latency Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Channel Latency</span>
                    <span className={`text-base font-black tracking-tight ${
                      socketLatency === null 
                        ? 'text-zinc-450' 
                        : socketLatency < 50 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : socketLatency < 150 
                            ? 'text-amber-500 dark:text-amber-400' 
                            : 'text-rose-500 dark:text-rose-400'
                    }`}>
                      {socketLatency !== null ? `${socketLatency} ms` : '—'}
                      {socketLatency !== null && (
                        <span className="block text-[8px] font-medium tracking-normal text-zinc-405 mt-0.5 uppercase">
                          {socketLatency < 50 ? 'Excellent (WSS Speed)' : socketLatency < 150 ? 'Standard Route' : 'Congested Link'}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Transport Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Transport Engine</span>
                    <span className="text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 font-mono tracking-wider">
                      {socketTransport ? socketTransport : 'None'}
                    </span>
                  </div>

                  {/* Synced Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                    <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">Test Completed At</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                      {socketTimestamp ? socketTimestamp : 'Not Run'}
                    </span>
                  </div>
                </div>

                {/* Error Banner inside diagnostics block */}
                {socketError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/55 rounded-xl flex items-center gap-2 text-[10px] text-rose-700 dark:text-rose-400 font-mono">
                    <WifiOff size={13} className="shrink-0" />
                    <strong>Link Failed:</strong> {socketError}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-250/20 text-rose-700 dark:text-rose-400 text-xs rounded-2xl flex items-center gap-2">
              <XCircle size={16} /> Error connecting to proxy node status endpoint: {error}
            </div>
          )}

          {/* Outbound IP Guideline */}
          {dbStatus && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-3">
              <strong className="text-xs font-black uppercase tracking-wider block text-rose-700 dark:text-rose-400">⚠️ Critical DNS & Whitelist Note</strong>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Google Cloud Run directs outbound packets dynamically. The actual outbound egress IP of your application server container is <code className="bg-rose-50 dark:bg-zinc-950 border border-rose-250/20 px-2 py-1 rounded font-mono font-black text-rose-700 dark:text-rose-400 select-all">{dbStatus.outboundIp || "Calculating..."}</code>.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If cPanel prevents communication, make sure you configure <strong>Remote MySQL</strong> to whitelist this actual IP <code className="bg-zinc-100 dark:bg-zinc-950 hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors px-1.5 py-0.5 rounded font-mono font-bold select-all">{dbStatus.outboundIp || "Calculating Outbound IP..."}</code>. Whitelisting the wildcard host host (<code>%</code>) is not allowed.
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Database Schema Setup Checks */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal size={15} className="text-brand" /> Relational SQL Schema
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We have generated and validated a unified local <strong>mysql-schema.sql</strong> file inside folder root:
            </p>
            <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-650 dark:text-brand flex items-center justify-between">
              <span>/mysql-schema.sql</span>
              <span className="text-[9px] bg-brand/10 text-brand font-black uppercase px-2 py-0.5 rounded">Ready</span>
            </div>
            
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Run this SQL query blocks inside cPanel phpMyAdmin to construct the 10 core tables cleanly.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={15} className="text-brand" /> cPanel Manual Checklist
            </h2>
            
            <div className="space-y-4 text-xs">
              
              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">1</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-white">Create Database & User</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Deploy database schema in cPanel setup and map full user privileges.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">2</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-white">Authorize Access Host</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Go to Remote MySQL and authorise the actual outbound IP: <code className="font-black select-all bg-zinc-100 dark:bg-zinc-950 px-1 py-0.5 rounded text-rose-600 dark:text-rose-450 font-mono">{(dbStatus && dbStatus.outboundIp) || "Loading IP..."}</code>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">3</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-white">Execute SQL Setup</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Open phpMyAdmin backend interface, copy raw statements from <code>mysql-schema.sql</code> and invoke.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 shrink-0 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">4</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-white">Authorize FTP Storage</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Ensure VPS_FTP host credentials are populated in AI Studio secret key parameters.</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
