import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "this property",
  isDeleting = false
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/65 backdrop-blur-xs"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl z-10 space-y-6 font-sans text-left"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0 border border-red-105 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Delete Listing?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
                  Are you sure you want to delete <strong className="font-semibold text-zinc-800 dark:text-zinc-200">"{title}"</strong>?
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  This action is irreversible and will permanently wipe the listing details and associated imagery files from Firestore cloud indexes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer"
              >
                No, Keep Profile
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Delete Listing
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
