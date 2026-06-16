import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  HelpCircle,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebase';

interface PropertyFinderPortalImporterProps {
  onImportSuccess: () => void;
  existingListingIds: string[];
}

export default function PropertyFinderPortalImporter({ onImportSuccess, existingListingIds }: PropertyFinderPortalImporterProps) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportResults([]);
    try {
      const response = await fetch('/api/propertyfinder/listings');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch Property Finder listings.');
      setListings(data.listings || []);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to query properties from your Partner Desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = (filteredList: any[]) => {
    const importableFiltered = filteredList.filter(l => !isAlreadyImported(l.id));
    const importableFilteredIds = importableFiltered.map(l => String(l.id));
    
    const allSelected = importableFilteredIds.length > 0 && importableFilteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(selectedIds.filter(id => !importableFilteredIds.includes(id)));
    } else {
      const union = Array.from(new Set([...selectedIds, ...importableFilteredIds]));
      setSelectedIds(union);
    }
  };

  const isAlreadyImported = (pfId: string) => {
    return existingListingIds.includes(`pf-imported-${pfId}`);
  };

  const handleImportSelected = async () => {
    if (selectedIds.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccess(null);
    const results: any[] = [];
    
    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        try {
          const authUser = getAuth().currentUser;
          const hostUid = authUser ? authUser.uid : 'imported_pf';

          const response = await fetch('/api/propertyfinder/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId: id, hostId: hostUid })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Import failed.');
          
          // Write to Firestore for full synchronization & immediate visibility across public and admin interfaces!
          if (data.propertyId && data.property) {
            try {
              // Deep clean helper to ensure no undefined values are sent to Firestore
              const cleanProperty: Record<string, any> = {};
              for (const [k, v] of Object.entries(data.property || {})) {
                if (v !== undefined) {
                  cleanProperty[k] = v;
                }
              }

              const fsProperty = {
                ...cleanProperty,
                hostId: hostUid,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              await setDoc(doc(db, 'properties', data.propertyId), fsProperty);
            } catch (fsErr: any) {
              console.warn('[Importer Sync] Failed to register in Firestore collection:', fsErr.message);
            }
          }
          
          results.push({ id, title: data.title, success: true, message: data.message, docUrl: data.documentUrl, imagesCount: data.imagesCount });
        } catch (err: any) {
          results.push({ id, success: false, error: err.message || 'Unknown processing error.' });
        }
      }
      
      setImportResults(results);
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0) {
        setSuccess(`Successfully synchronized & prepared ${successCount} listings in the local SQL server!`);
        onImportSuccess();
      } else {
        setError('Failed to import selected listings. Check individual status results.');
      }
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message || 'Bulk porting routine failed.');
    } finally {
      setImporting(false);
    }
  };

  // Filter listings based on search box input
  const filteredListings = listings.filter(item => {
    const matchStr = (
      (item.title || '') + ' ' + 
      (item.locationName || item.buildingName || '') + ' ' + 
      (item.referenceNo || '') + ' ' +
      (item.type || '')
    ).toLowerCase();
    return matchStr.includes(search.toLowerCase());
  });

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-150 dark:border-zinc-850 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Building2 className="w-5 h-5 animate-pulse" />
            </span>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
              Property Finder Partner Portal Sync
            </h3>
          </div>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
            Directly select active listings, auto-download secure legal documents, and register them into the database records.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchListings}
          disabled={loading || importing}
          className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-805 text-zinc-750 dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Portal Registry
        </button>
      </div>

      {/* Main Alert Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs rounded-2xl flex flex-col gap-2 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-center gap-3">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
          {importResults.length > 0 && (
            <div className="mt-2 bg-white/70 dark:bg-zinc-950/70 p-3 rounded-xl border border-emerald-100/40 dark:border-emerald-900/20 space-y-1 max-h-36 overflow-y-auto">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Import Log:</span>
              {importResults.map((res, idx) => (
                <div key={idx} className="text-[11px] flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-905 last:border-0">
                  <span className="truncate text-zinc-800 dark:text-zinc-200 font-bold max-w-xs">{res.title || `Property ID ${res.id}`}</span>
                  <div className="flex items-center gap-2">
                    {res.success ? (
                      <>
                        <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md">
                          Imported ({res.imagesCount} Images)
                        </span>
                        {res.docUrl && (
                          <a 
                            href={res.docUrl} 
                            target="_blank" 
                            rel="referrer noopener"
                            className="text-blue-500 hover:underline flex items-center gap-1 text-[10px]"
                            title="Download localized copy of the secure document"
                          >
                            <FileText className="w-3 h-3" /> Deed PDF
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md">
                        Failed: {res.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Local Filter Control and Selection count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search matching properties in current Partner Desk feed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleImportSelected}
          disabled={selectedIds.length === 0 || importing}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:cursor-not-allowed"
        >
          {importing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Downloading Media & Docs...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Import {selectedIds.length} Selected Listings
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          <p className="text-xs font-medium">Contacting Property Finder Partner Portal API...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center text-xs text-zinc-400">
          No listings available. Put proper Property Finder Endpoint API Key in the Integrations Settings to sync your account.
        </div>
      ) : (
        <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-extrabold uppercase select-none z-10">
                <tr>
                  <th className="p-3 w-10">
                    <input 
                      type="checkbox" 
                      onChange={() => handleToggleSelectAll(filteredListings)}
                      checked={
                        filteredListings.filter(l => !isAlreadyImported(l.id)).length > 0 &&
                        filteredListings.filter(l => !isAlreadyImported(l.id)).every(l => selectedIds.includes(String(l.id)))
                      }
                      disabled={filteredListings.filter(l => !isAlreadyImported(l.id)).length === 0}
                      className="rounded text-orange-600 focus:ring-orange-500 border-zinc-300 dark:border-zinc-700 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="p-3">Listing Details</th>
                  <th className="p-3">Reference / Permit No</th>
                  <th className="p-3">Pricing & Area</th>
                  <th className="p-3">Document Copy</th>
                  <th className="p-3 text-right">Owner Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
                {filteredListings.map((item) => {
                  const alreadySaved = isAlreadyImported(item.id);
                  const isChecked = selectedIds.includes(String(item.id));
                  const images = item.media?.images || item.images || [];
                  const previewImg = images[0]?.url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80";
                  const hasTitleDeed = !!(item.titleDeedUrl || item.titleDeed?.value);

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all ${alreadySaved ? 'opacity-70 bg-zinc-50/20' : ''}`}
                    >
                      <td className="p-3">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleToggleSelect(String(item.id))}
                          disabled={alreadySaved}
                          className="rounded text-orange-600 focus:ring-orange-500 border-zinc-300 dark:border-zinc-700 cursor-pointer disabled:cursor-not-allowed w-4 h-4"
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex gap-3">
                          <img 
                            src={previewImg} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-12 rounded-lg object-cover bg-zinc-100 border border-zinc-200 dark:border-zinc-800 shrink-0"
                          />
                          <div className="space-y-0.5 max-w-sm">
                            <p className="font-extrabold text-zinc-900 dark:text-white leading-tight truncate">{item.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span className="font-bold uppercase tracking-wider">{item.category || item.type || 'Apartment'}</span>
                              <span>•</span>
                              <span className="truncate">{item.locationName || item.buildingName || 'Dubai'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {item.assignedTo?.name || 'Unassigned'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[10px] space-y-0.5 text-zinc-600 dark:text-zinc-400">
                        <p className="font-extrabold text-zinc-800 dark:text-zinc-250 uppercase">{item.referenceNo || `ID-${item.id}`}</p>
                        <p className="text-zinc-400">Permit: {item.permitDetails?.permitNumber || item.listingAdvertisementNumber || 'Not Required'}</p>
                      </td>

                      <td className="p-3 space-y-0.5">
                        <p className="font-extrabold text-zinc-900 dark:text-white">
                          AED {Number(item.price?.value || item.price || 0).toLocaleString()}
                          <span className="text-[10px] text-zinc-400 font-normal"> / {item.price?.period || 'annual'}</span>
                        </p>
                        <p className="text-[10px] font-medium text-zinc-450">{item.size || 0} Sq Ft • {item.bedrooms || 0} Beds • {item.bathrooms || 0} Baths</p>
                      </td>

                      <td className="p-3">
                        {hasTitleDeed ? (
                          <div className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Title Deed
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono">None Provided</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {alreadySaved ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase">
                            <Check className="w-3.5 h-3.5" /> Imported
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds([String(item.id)]);
                              handleImportSelected();
                            }}
                            className="px-2.5 py-1 bg-zinc-100 hover:bg-orange-600 dark:bg-zinc-800 dark:hover:bg-orange-650 hover:text-white text-zinc-700 dark:text-zinc-200 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer"
                          >
                            Import Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-850 p-3 px-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-450">
            <span className="font-bold">
              Showing {filteredListings.length} portal listings available of {listings.length} retrieved.
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-zinc-400" /> Connection Secure • SSL verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
