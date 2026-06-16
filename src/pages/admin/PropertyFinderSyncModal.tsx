import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, CloudLightning, Loader2, ArrowRight } from 'lucide-react';
import { Property } from '../../types';

interface PropertyFinderSyncModalProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyFinderSyncModal({ property, onClose }: PropertyFinderSyncModalProps) {
  const [region, setRegion] = useState<'dubai' | 'abudhabi'>('dubai');
  const [permitNumber, setPermitNumber] = useState(property.referenceNo || '20421394');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setComplianceResult(null);
    setSyncStatus(null);
    setErrorMessage(null);
  };

  const handleComplianceCheck = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/services/propertyfinder/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permitNumber, licenseNumber })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setComplianceResult(data.compliance);
      } else {
        setErrorMessage(data.error || 'The remote compliance server turned away the permit verification check.');
      }
    } catch (err: any) {
      setErrorMessage('Local environment failed to bridge check: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSyncToPortal = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      // Map listing to schema defined in /help/openapi.json
      const response = await fetch('/api/services/propertyfinder/sync-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing: {
            title: property.title,
            description: property.description || 'Stunning executive holiday layout close to waterfront amenities.',
            type: property.category || 'Apartment',
            price: Number(property.priceMonthly || (property.price * 30)),
            priceType: 'rent',
            pricePeriod: 'monthly',
            size: 1350,
            builtUpArea: 1350,
            images: property.images?.webp?.join(',') || '',
            listingAdvertisementNumber: permitNumber
          },
          permitDetails: complianceResult
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSyncStatus(data);
      } else {
        setErrorMessage(data.error || 'Server rejected the Property Finder draft sync upload request.');
      }
    } catch (err: any) {
      setErrorMessage('Sync gateway pipeline error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
              <CloudLightning size={20} className="animate-pulse" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Property Finder Portal Sync</h3>
              <p className="text-[11px] text-zinc-400">Enterprise API Gateway Integrator</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-805 space-y-1">
            <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider">{property.title}</p>
            <p className="text-[11px] text-zinc-450 truncate">Ref: {property.referenceNo} • Category: {property.category} • Location: {property.location?.address}</p>
          </div>

          {!syncStatus ? (
            <div className="space-y-5">
              {/* Region Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Regulatory Land Authority Region</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setRegion('dubai'); resetState(); }}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      region === 'dubai'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-200'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    Dubai (DLD & RERA)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegion('abudhabi'); resetState(); }}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      region === 'abudhabi'
                        ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-200'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'
                    }`}
                  >
                    Abu Dhabi (ADREC)
                  </button>
                </div>
              </div>

              {/* Input details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {region === 'dubai' ? 'RERA Permit Number' : 'ADREC Permit Number'}
                  </label>
                  <input
                    type="text"
                    value={permitNumber}
                    onChange={e => { setPermitNumber(e.target.value); resetState(); }}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                    placeholder="e.g. 20421394"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {region === 'dubai' ? 'Company License No (Optional)' : 'Broker License Number'}
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => { setLicenseNumber(e.target.value); resetState(); }}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                    placeholder={region === 'dubai' ? 'Default license used' : 'e.g. B-12344'}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-150 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-650 dark:text-red-400">Compliance Warning</p>
                    <p className="text-[11px] text-red-500/90 leading-relaxed font-sans">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Step 1: Compliance checker */}
              {!complianceResult ? (
                <button
                  type="button"
                  disabled={isVerifying || !permitNumber}
                  onClick={handleComplianceCheck}
                  className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-850 dark:hover:bg-white text-white dark:text-zinc-900 py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Contacting Dubai Land Department registry...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Verify Official Land Department Permit details
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Valid compliance info block */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-150 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Permit Valid & Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-1">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sale Type</p>
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{complianceResult.data?.[0]?.property?.saleType || 'Secondary market'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">DLD Listing category</p>
                        <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{complianceResult.data?.[0]?.property?.listingType || 'Unit approved'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sync listing block */}
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncToPortal}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-md"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Queuing draft listings inside Property Finder...
                      </>
                    ) : (
                      <>
                        <CloudLightning size={16} />
                        Synchronize Listing & Publish to Property Finder
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 text-center py-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-150">Publishing Request Received!</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto font-sans">
                  The property was synced as a Draft. A request to publish has been dispatched asynchronously to your Property Finder Partner account.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-805 p-4 rounded-2xl max-w-sm mx-auto text-left space-y-1 font-mono text-[10px] text-zinc-500">
                <p className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-1 pb-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">SYSTEM RESPONSE</p>
                <p><span className="text-zinc-400">ASSIGNED ID:</span> {syncStatus.listingId}</p>
                <p><span className="text-zinc-400">SYNC WORKFLOW:</span> DRAFT -&gt; PUBLISH</p>
                <p><span className="text-zinc-400">RESPONSE STATE:</span> {syncStatus.status || 'DRAFT'}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                Close Gateway console
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
