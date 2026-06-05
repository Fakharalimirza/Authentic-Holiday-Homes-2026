import React, { useState, useEffect } from 'react';
import { Mail, Send, Save, AlertCircle, CheckCircle, Play, Sparkles, Loader2, ArrowRight, HelpCircle } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
}

export default function TemplatesConsole() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Editor states
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editVariables, setEditVariables] = useState('');

  // Test send parameters
  const [testEmail, setTestEmail] = useState('');
  
  // Scans output
  const [scanOutput, setScanOutput] = useState<{
    success: boolean;
    message: string;
    processedCount?: number;
    sentEmails?: string[];
  } | null>(null);

  // Status banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          const first = data.templates[0];
          setSelectedId(first.id);
          setEditName(first.name);
          setEditSubject(first.subject);
          setEditBody(first.body);
          setEditVariables(first.variables);
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setErrorMsg("Failed to connect to the backend server to fetch email templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelect = (tpl: EmailTemplate) => {
    setSelectedId(tpl.id);
    setEditName(tpl.name);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
    setEditVariables(tpl.variables);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/email-templates/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          subject: editSubject,
          body: editBody,
          variables: editVariables
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Email template updated successfully inside the cPanel database.");
        // Refill templates
        setTemplates(prev => 
          prev.map(t => t.id === selectedId ? { ...t, name: editName, subject: editSubject, body: editBody, variables: editVariables } : t)
        );
      } else {
        setErrorMsg(data.error || "Failed to persist template modifications.");
      }
    } catch (err) {
      setErrorMsg("Error communicating with server API endpoints.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !testEmail) return;
    setTesting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/email-templates/${selectedId}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Test delivery successfully logged & simulated for ${testEmail}! Verify the platform Audit Trails for details.`);
      } else {
        setErrorMsg(data.error || "Test transmission failed.");
      }
    } catch (err) {
      setErrorMsg("Network error trying to deliver test template.");
    } finally {
      setTesting(false);
    }
  };

  const handleRunBirthdayScan = async () => {
    setScanning(true);
    setScanOutput(null);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/birthday-check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScanOutput({
          success: true,
          message: data.message,
          processedCount: data.processedMatchCount,
          sentEmails: data.sentEmails
        });
      } else {
        setScanOutput({
          success: false,
          message: data.error || "Manual scan execution was rejected by server."
        });
      }
    } catch (err) {
      setScanOutput({
        success: false,
        message: "Failed to connect to the birthday scheduler server."
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH BIRTHDAY TRIGGER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Email Communication Templates</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Customize and configure automated transaction notifications, bookings status emails, and automated client birthday systems.
          </p>
        </div>
        
        <button
          onClick={handleRunBirthdayScan}
          disabled={scanning}
          type="button"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition duration-150 shadow-sm shadow-indigo-100 dark:shadow-none"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning Users...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Birthday Check Now
            </>
          )}
        </button>
      </div>

      {/* BIRTHDAY SCANNER RUN RESULTS ON TOP */}
      {scanOutput && (
        <div className={`p-5 rounded-2xl border ${scanOutput.success ? 'bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50' : 'bg-red-50/70 border-red-200/80 dark:bg-red-950/20 dark:border-red-900/50'} transition-all`}>
          <div className="flex items-start gap-3">
            {scanOutput.success ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {scanOutput.success ? "Automated Database Scan Completed" : "Birthday Database Check Interrupted"}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {scanOutput.message}
              </p>
              
              {scanOutput.success && (
                <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2">
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Total Birthday Matches Scanned Today:</span>
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {scanOutput.processedCount || 0}
                    </span>
                  </div>
                  
                  {scanOutput.sentEmails && scanOutput.sentEmails.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Target Dispatched Emails list:</span>
                      <ul className="text-xs font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {scanOutput.sentEmails.map((email, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs italic text-zinc-500">
                      No active user dates of birth correspond to today's date (or matching emails were already processed and cached).
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm flex items-center gap-2.5">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-400 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
          <p className="text-zinc-500 text-sm font-medium">Retrieving templates from remote DB bridge...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SIDEBAR LIST */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 px-1 uppercase tracking-wider">Available Modules</h3>
            <div className="space-y-2">
              {templates.map((tpl) => {
                const isSelected = selectedId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelect(tpl)}
                    type="button"
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 dark:bg-zinc-800/70 dark:border-zinc-700'
                        : 'bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="font-bold text-zinc-900 dark:text-white mb-1">
                      {tpl.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                      ID: {tpl.id}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                      Subject: {tpl.subject}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* MANUAL BOX */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Template Tokens Guide</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Provide placeholders within the custom editor like <code className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-1 py-0.5 rounded font-bold font-mono">{"{{displayName}}"}</code> and the sending framework automatically resolves user records before routing letters.
              </p>
            </div>
          </div>

          {/* MAIN FORM EDITOR */}
          <div className="lg:col-span-2 space-y-6">
            {selectedId ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Editing Template</span>
                    <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full uppercase font-mono">
                      {selectedId}
                    </span>
                  </div>

                  {/* TEMPLATE NAME */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Template Title Name</label>
                    <input
                      required
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* EMAIL SUBJECT */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Outgoing Mail Subject Line</label>
                    <input
                      required
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* RELEVANT VARIABLES LISTED */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2.5">
                    <Sparkles className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-400">
                      <span className="font-bold">Available Dynamic Tags: </span>
                      {editVariables ? (
                        editVariables.split(',').map((variable, vIdx) => (
                          <span key={vIdx} className="inline-block bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-950/60 font-mono font-bold px-1.5 py-0.5 rounded text-[11px] mr-1.5 mb-1 text-zinc-900 dark:text-zinc-200">
                            {"{{"}{variable.trim()}{"}}"}
                          </span>
                        ))
                      ) : (
                        <span className="italic">No custom variable tags restricted. This is a generic notification.</span>
                      )}
                    </div>
                  </div>

                  {/* BODY SOURCE */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Message Body Content (Markdown/Plaintxt)</label>
                      <span className="text-[11px] text-zinc-400">Newlines will auto-convert to mail paragraph breaks</span>
                    </div>
                    <textarea
                      required
                      rows={10}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition duration-150 shadow-sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Commit Template Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* TEST DELIVERY SANDBOX */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-indigo-500" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Simulate Test Dispatch</h4>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Input an email address below to inspect this template using dummy mock credentials. If live environment variables are set in cPanel, our SMTP mail system sends a real message, else it records the complete transmission schema inside the Audit Trails console!
                  </p>

                  <form onSubmit={handleTestSend} className="flex gap-2.5">
                    <input
                      required
                      type="email"
                      placeholder="e.g. your-email@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      disabled={testing}
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 disabled:bg-zinc-300 text-white font-semibold rounded-xl text-sm transition"
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Test Box"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <HelpCircle className="h-10 w-10 text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-350">No module template selected.</p>
                <p className="text-xs text-zinc-400 mt-1">Please select an email template from the listing sideboard directory to modify.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
