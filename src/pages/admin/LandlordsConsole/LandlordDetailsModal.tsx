import React from 'react';
import { EyeOff, Landmark, CreditCard, FileText } from 'lucide-react';

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

interface LandlordDetailsModalProps {
  landlord: LandlordItem;
  onClose: () => void;
  getSecureDocViewUrl: (url: string | null | undefined) => string;
}

export default function LandlordDetailsModal({
  landlord,
  onClose,
  getSecureDocViewUrl
}: LandlordDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 font-sans">
              Landlord Credentials Summary
            </h3>
            <button 
              onClick={onClose}
              className="p-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-50 rounded-full transition-all cursor-pointer font-sans"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1 no-scrollbar text-xs">
            {/* Profile Box */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-zinc-500 font-sans">Personal & Compliance Info</h4>
              <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Full Name</span>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{landlord.fullName}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Nationality</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{landlord.nationality || 'Unspecified'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Email</span>
                  <p className="font-medium break-all text-zinc-900 dark:text-zinc-100">{landlord.email}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Phone</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{landlord.phone || 'Unavailable'}</p>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-sans">Identity Number</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{landlord.identityNumber || 'Unspecified'}</p>
                </div>
              </div>
            </div>

            {/* Bank Box */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-2">
              <h4 className="font-extrabold uppercase text-[10px] tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-sans">
                <Landmark className="w-3.5 h-3.5" />
                Payout & Banking Credentials
              </h4>
              {landlord.bankName ? (
                <div className="grid grid-cols-2 gap-3 mt-1 text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">Bank Name</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{landlord.bankName}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">Account Holder</span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{landlord.bankAccountHolder || 'Unspecified'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">IBAN</span>
                    <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all font-semibold break-all">{landlord.iban || 'Unspecified'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">Account Number</span>
                    <p className="font-sans text-zinc-900 dark:text-zinc-100 select-all">{landlord.bankAccountNumber || 'Unspecified'}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">Swift Code</span>
                    <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all">{landlord.swiftCode || 'Unspecified'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block text-[10px] uppercase font-sans">Branch Name</span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{landlord.bankBranch || 'Unspecified'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">No bank registry details have been logged for this landlord.</p>
              )}
            </div>

            {/* Secure Documents Viewer Link */}
            {landlord.identityDocumentUrl && (
              <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-2xl">
                <span className="font-semibold text-[10px] uppercase tracking-wider font-sans">EMIRATES ID FILE</span>
                <a 
                  href={getSecureDocViewUrl(landlord.identityDocumentUrl)} 
                  target="_blank" 
                  rel="noreferrer referrer"
                  className="px-3.5 py-1.5 bg-white text-zinc-900 hover:bg-zinc-100 rounded-xl font-bold uppercase text-[9px] flex items-center gap-1.5 font-sans"
                >
                  View Passport / Identity <FileText className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
