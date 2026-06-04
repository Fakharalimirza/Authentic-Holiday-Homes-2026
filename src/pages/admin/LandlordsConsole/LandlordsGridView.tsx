import React from 'react';
import { User, Eye, Edit2, Trash2, Mail, Phone, Shield, CreditCard, FileText } from 'lucide-react';

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

interface LandlordsGridViewProps {
  landlords: LandlordItem[];
  onViewDetails: (landlord: LandlordItem) => void;
  onEdit: (landlord: LandlordItem) => void;
  onDelete: (landlord: LandlordItem) => void;
  getSecureDocViewUrl: (url: string | null | undefined) => string;
}

export default function LandlordsGridView({
  landlords,
  onViewDetails,
  onEdit,
  onDelete,
  getSecureDocViewUrl
}: LandlordsGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 font-sans">
      {landlords.map((land) => (
        <div 
          key={land.id}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            {/* Visual Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-650 dark:text-zinc-350 border border-zinc-100 dark:border-zinc-850">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-855 dark:text-zinc-100 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
                    {land.fullName}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-650 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {land.nationality || 'Nationality Unspecified'}
                  </span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onViewDetails(land)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                  title="View Payout Info"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(land)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 rounded-lg transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(land)}
                  className="p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-red-500 hover:text-red-750 rounded-lg transition-all cursor-pointer"
                  title="Delete profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <hr className="my-4 border-zinc-100 dark:border-zinc-800" />

            {/* Info block */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{land.email}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{land.phone || 'Phone not available'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-550 dark:text-zinc-400">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">ID/Passport: {land.identityNumber || 'No identity ID listed'}</span>
              </div>
            </div>
          </div>

          {/* Bank summary footer line */}
          <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-xl px-3 py-2.5 mt-4 border border-zinc-100/50 dark:border-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-638 dark:text-emerald-400" />
              <span className="font-semibold text-zinc-750 dark:text-zinc-300 text-[11px] truncate max-w-[140px]">
                {land.bankName || 'No linked bank accounts'}
              </span>
            </div>
            {land.identityDocumentUrl ? (
              <a 
                href={getSecureDocViewUrl(land.identityDocumentUrl)} 
                target="_blank" 
                rel="noreferrer referrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-150 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-xl hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 text-[10px] font-black uppercase tracking-wider transition-all"
                title="View Registered Identity File (E-ID or Passport)"
                id={`secure-doc-grid-link-${land.id}`}
              >
                <FileText className="w-3 h-3" /> View Passport
              </a>
            ) : (
              <span className="text-[10px] text-zinc-400 italic">No Identity Doc</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
