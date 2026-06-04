import React, { useState, useEffect } from 'react';
import { EyeOff, AlertCircle, Check, Loader2, Upload, Eye } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

interface LandlordItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
  identityDocumentUrl: string | null;
  nationality: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  swiftCode: string;
  iban: string;
  bankBranch: string;
}

interface LandlordFormModalProps {
  selectedLandlord: LandlordItem | null;
  onClose: () => void;
  onRefresh: () => void;
  getSecureDocViewUrl: (url: string | null | undefined) => string;
}

export default function LandlordFormModal({
  selectedLandlord,
  onClose,
  onRefresh,
  getSecureDocViewUrl
}: LandlordFormModalProps) {
  const { user, profile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formFields, setFormFields] = useState({
    fullName: '',
    email: '',
    phone: '',
    identityNumber: '',
    identityDocumentUrl: '',
    nationality: '',
    bankName: '',
    bankAccountHolder: '',
    bankAccountNumber: '',
    swiftCode: '',
    iban: '',
    bankBranch: ''
  });

  useEffect(() => {
    if (selectedLandlord) {
      setFormFields({
        fullName: selectedLandlord.fullName || '',
        email: selectedLandlord.email || '',
        phone: selectedLandlord.phone || '',
        identityNumber: selectedLandlord.identityNumber || '',
        identityDocumentUrl: selectedLandlord.identityDocumentUrl || '',
        nationality: selectedLandlord.nationality || '',
        bankName: selectedLandlord.bankName || '',
        bankAccountHolder: selectedLandlord.bankAccountHolder || '',
        bankAccountNumber: selectedLandlord.bankAccountNumber || '',
        swiftCode: selectedLandlord.swiftCode || '',
        iban: selectedLandlord.iban || '',
        bankBranch: selectedLandlord.bankBranch || ''
      });
    } else {
      setFormFields({
        fullName: '',
        email: '',
        phone: '',
        identityNumber: '',
        identityDocumentUrl: '',
        nationality: '',
        bankName: '',
        bankAccountHolder: '',
        bankAccountNumber: '',
        swiftCode: '',
        iban: '',
        bankBranch: ''
      });
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [selectedLandlord]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check if landlord name has been filled so upload directory is named nicely
    if (!formFields.fullName.trim()) {
      alert("Please enter the Landlord Full Name first to map files securely.");
      return;
    }

    setUploadingDoc(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', 'landlords');
    formData.append('identifier', formFields.fullName.trim());
    formData.append('docType', 'emirates_id');

    try {
      const res = await fetch('/api/admin/upload-document', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed. Verify VPS / storage system availability.");
      const data = await res.json();
      setFormFields(prev => ({ ...prev, identityDocumentUrl: data.url }));
      setSuccessMsg(`"${file.name}" uploaded successfully!`);

      // Add record metadata pointer in Firebase Firestore so it shows in Secure Document Vault
      try {
        await addDoc(collection(db, 'secured_documents'), {
          category: 'landlords',
          identifier: formFields.fullName.trim(),
          docType: 'emirates_id',
          fileName: data.fileName || file.name,
          originalName: file.name,
          title: file.name,
          url: data.url,
          storageType: data.storageType || 'local',
          uploadedBy: user?.uid || 'system',
          uploadedByName: profile?.displayName || user?.email || 'Administrator',
          uploadedAt: serverTimestamp()
        });
        console.log("Secure Document Vault index record created successfully.");
      } catch (dbErr: any) {
        console.error("Failed to catalog secure document in Firestore index:", dbErr);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload identity document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.fullName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!formFields.email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const landlordId = selectedLandlord ? selectedLandlord.id : `landlord_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    try {
      const res = await fetch('/api/admin/landlords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: landlordId,
          ...formFields
        })
      });

      if (!res.ok) throw new Error("Failed to persist landlord profile.");
      
      const text = selectedLandlord ? "Landlord details updated successfully!" : "Landlord registered successfully!";
      setSuccessMsg(text);
      onRefresh();
      setTimeout(onClose, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Could not save landlord profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-101 dark:border-zinc-805 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
        <div className="p-6 space-y-4 font-sans">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-zinc-50">
              {selectedLandlord ? 'Modify Landlord Profile' : 'Register New Landlord / Owner'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-705 dark:hover:text-zinc-250 rounded-xl cursor-pointer"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-955/20 text-red-750 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 border border-red-105">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-705 dark:text-emerald-450 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar text-xs">
            {/* Visual Section 1: Personal Info */}
            <div className="space-y-3">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Personal Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formFields.fullName}
                    onChange={(e) => setFormFields(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Abdullah Mirza"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formFields.email}
                    onChange={(e) => setFormFields(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="name@owner.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Phone Number</label>
                  <input
                    type="tel"
                    value={formFields.phone}
                    onChange={(e) => setFormFields(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Nationality</label>
                  <input
                    type="text"
                    value={formFields.nationality}
                    onChange={(e) => setFormFields(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. UAE national, British..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Identity/Passport Number</label>
                  <input
                    type="text"
                    value={formFields.identityNumber}
                    onChange={(e) => setFormFields(prev => ({ ...prev, identityNumber: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="784-1990-1234567-1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center justify-between font-sans">
                    <span>Identity Document (Passport/E-ID)</span>
                    {uploadingDoc && <Loader2 className="w-3" />}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formFields.identityDocumentUrl}
                      placeholder="No file uploaded yet"
                      className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-950 text-zinc-550 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none truncate"
                    />
                    {formFields.identityDocumentUrl && (
                      <a 
                        href={getSecureDocViewUrl(formFields.identityDocumentUrl)}
                        target="_blank"
                        rel="noreferrer referrer"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-[9px] flex items-center justify-center transition-all shadow-sm shrink-0"
                        title="View Document"
                      >
                        <Eye className="w-3 h-3" />
                      </a>
                    )}
                    <label className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[9px] flex items-center justify-center cursor-pointer transition-all shrink-0">
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg,.zip"
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Section 2: Bank Payout Info */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-emerald-600 dark:text-emerald-400 border-b border-zinc-100 dark:border-zinc-850 pb-1 font-sans">Bank Payout Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Bank Name</label>
                  <input
                    type="text"
                    value={formFields.bankName}
                    onChange={(e) => setFormFields(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="e.g. Emirates NBD"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Account Holder Name</label>
                  <input
                    type="text"
                    value={formFields.bankAccountHolder}
                    onChange={(e) => setFormFields(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="Exact name registered at bank"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Bank Account number</label>
                  <input
                    type="text"
                    value={formFields.bankAccountNumber}
                    onChange={(e) => setFormFields(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="Account Number string"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">IBAN Number</label>
                  <input
                    type="text"
                    value={formFields.iban}
                    onChange={(e) => setFormFields(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white font-mono"
                    placeholder="AE45 0090 0000 1234 5678 901"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={formFields.swiftCode}
                    onChange={(e) => setFormFields(prev => ({ ...prev, swiftCode: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white font-mono"
                    placeholder="e.g. EBILAEADXXX"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-sans">Bank Branch</label>
                  <input
                    type="text"
                    value={formFields.bankBranch}
                    onChange={(e) => setFormFields(prev => ({ ...prev, bankBranch: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 text-xs rounded-xl focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-750 font-sans text-zinc-900 dark:text-white"
                    placeholder="Downtown Branch"
                  />
                </div>
              </div>
            </div>

            {/* Submit button bar */}
            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-150 dark:border-zinc-805">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 rounded-xl font-semibold text-[10px] uppercase tracking-wider text-zinc-600 dark:text-zinc-350 transition-all cursor-pointer font-sans"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={isSubmitting || uploadingDoc}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer font-sans"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin text-white dark:text-zinc-900" />}
                {selectedLandlord ? 'Save Profiles' : 'Finalize Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
