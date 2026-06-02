import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Wrench, CheckCircle2, ShieldAlert, Sparkles, Clock, Compass, Check, AlertTriangle } from 'lucide-react';

interface TurnoverJob {
  id: string;
  propertyId: string;
  propertyTitle: string;
  referenceNo: string;
  buildingName?: string;
  unitNumber?: string;
  status: 'pending_cleaning' | 'cleaning_in_progress' | 'completed';
  notes?: string;
  createdAt?: any;
}

interface TurnoversTableProps {
  currentRole?: string;
}

export default function TurnoversTable({ currentRole }: TurnoversTableProps) {
  const [jobs, setJobs] = useState<TurnoverJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'turnovers'), (snapshot) => {
      const jobList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TurnoverJob[];
      setJobs(jobList);
      setLoading(false);
    }, (error) => {
      console.error("TurnoversTable: Error loading jobs:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateJobStatus = async (job: TurnoverJob, newStatus: 'pending_cleaning' | 'cleaning_in_progress' | 'completed') => {
    setSavingId(job.id);
    try {
      const batch = writeBatch(db);
      
      // Update job status
      const jobRef = doc(db, 'turnovers', job.id);
      batch.update(jobRef, { status: newStatus });

      // If turnover is marked as completed, make property vacant and set isAvailable to true
      if (newStatus === 'completed') {
        const propRef = doc(db, 'properties', job.propertyId);
        batch.update(propRef, {
          isAvailable: true,
          status: 'vacant'
        });
      } else {
        // Under cleaning/maintenance
        const propRef = doc(db, 'properties', job.propertyId);
        batch.update(propRef, {
          isAvailable: false,
          status: 'maintenance'
        });
      }

      await batch.commit();
    } catch (err: any) {
      console.error("Error updating turnover status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const isOpsOrAdmin = ['super_admin', 'admin', 'maintenance', 'host'].includes(currentRole || '');

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-zinc-50 dark:bg-zinc-950 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Wrench className="text-brand shrink-0" size={20} />
            Turnover & Turnaround Job Queue
          </h2>
          <p className="text-xs text-zinc-500">
            Automatically logged checkouts needing cleaning, inspection, and sanitization before re-listing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {jobs.map(job => (
          <div 
            key={job.id}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  job.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border border-green-200'
                    : job.status === 'cleaning_in_progress'
                    ? 'bg-amber-100 text-amber-805 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-205'
                    : 'bg-rose-105 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200'
                }`}>
                  {job.status.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Ref: {job.referenceNo}
                </span>
              </div>
              
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {job.propertyTitle}
              </h3>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-550 dark:text-zinc-450 font-medium">
                {job.buildingName && <span>Building: {job.buildingName}</span>}
                {job.unitNumber && <span>Unit: {job.unitNumber}</span>}
              </div>

              {job.notes && (
                <p className="text-xs bg-zinc-55 dark:bg-zinc-950/40 border border-zinc-150 p-2.5 rounded-xl text-zinc-650 max-w-xl">
                  {job.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col md:items-end gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-zinc-100 dark:border-zinc-800">
              {savingId === job.id ? (
                <span className="text-xs font-bold text-zinc-450 animate-pulse">Updating status...</span>
              ) : isOpsOrAdmin ? (
                <div className="flex gap-2">
                  {job.status === 'pending_cleaning' && (
                    <button
                      onClick={() => updateJobStatus(job, 'cleaning_in_progress')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                    >
                      Start Work
                    </button>
                  )}
                  {job.status !== 'completed' && (
                    <button
                      onClick={() => updateJobStatus(job, 'completed')}
                      className="px-4 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center gap-1.5"
                    >
                      <Check size={14} /> Finish & Release Vacant
                    </button>
                  )}
                  {job.status === 'completed' && (
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-3 py-1 rounded-xl">
                      <CheckCircle2 size={14} /> Available
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Read-only operational status
                </span>
              )}
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950/30 border-2 border-dashed border-zinc-200 dark:border-zinc-805 rounded-[2rem] p-6">
            <Sparkles className="mx-auto text-brand shrink-0 mb-3 animate-pulse" size={32} />
            <p className="text-zinc-808 dark:text-white font-bold text-sm">All Rooms Sanitized & Vacant!</p>
            <p className="text-zinc-400 text-xs mt-1">Checkouts automatically populate this maintenance dispatcher dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
