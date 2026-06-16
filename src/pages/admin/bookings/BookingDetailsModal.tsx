import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Mail, Phone, FileText, Check, AlertCircle, Save, Printer,
  ArrowRight, CreditCard, ClipboardList, PenTool, RefreshCw, ShieldAlert,
  ChevronRight, AlertTriangle, Sparkles, CheckCircle2, DollarSign, Activity
} from 'lucide-react';
import { AdminBooking } from './types';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Import newly modularized step components
import Step1ProfileVerification from './steps/Step1ProfileVerification';
import Step2FinanceChecklist from './steps/Step2FinanceChecklist';
import Step3CheckInInspection from './steps/Step3CheckInInspection';
import Step4StayDecision from './steps/Step4StayDecision';
import Step5CheckOutInspection from './steps/Step5CheckOutInspection';
import Step6DamagesSettlement from './steps/Step6DamagesSettlement';

interface BookingDetailsModalProps {
  booking: AdminBooking;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onUpdateBooking: (id: string, updatedFields: Partial<AdminBooking>) => Promise<void>;
}

// 4 Pre-made checklists depending on unit layout
const defaultChecklists: Record<string, string[]> = {
  studio: [
    "Studio Bedding & Pillows Cleanliness",
    "Kitchenette Refrigerator, Microwave & Cabinetry Hooks",
    "Bathroom Plumbing Fixtures & Water Heater System",
    "AC Cooling Efficiency & Thermostat Digital Readout",
    "Apartment Key Cards, Entrance Lock & Audio Intercom",
    "Balcony Sliding Door Locks & Safety Window Panels"
  ],
  "1bhk": [
    "Living Room L-Sofa, Smart TV Setup & Cable Console",
    "Master Bed Frame stability & Hospitality-grade Sheets",
    "Kitchen Major Stove Hob, Fridge, Oven & cutlery sets",
    "Main Bathroom Water Flow, Mirror Defogger & Cabinets",
    "Zone Air Conditioning Cooling Vent and Remotes",
    "Master Keys, Parking RFID Card & High-Security FOB",
    "Balcony Decking condition, Patio Glass & Window Seals"
  ],
  "2bhk": [
    "Spacious lounge Sofas, Coffee Table & Wall Sconces",
    "6-Seater Solid Dining Table Chairs & Accent Mirror",
    "Master Bedroom King Mattress, Linen Sets & Nightstands",
    "Guest Bedroom Twin Beds, Pillow Covers & Built-In Closets",
    "Chef Kitchen Fridge, Gas Burner Hob and Dishwasher Unit",
    "Master Bath Tub, Drainage, Water heater & Exhaust Fan",
    "Shared Bathroom fittings, Vanity Sink & Guest hand-scrubs",
    "Dual Zone AC Compressor system & Dual Controllers",
    "Apartment Entry Keys, Parking Gate RFID & Smart Lock Hub",
    "Double Glazed Balcony Glass Panes & Metal Rail Handles"
  ],
  "3bhk": [
    "Premium Velvet Lounge Suites, TV Unit & Chandelier Vents",
    "8-Seater Formal Glass Dining Set & Decorative Credenzas",
    "Master Ensuite Bed, Fitted Walk-in Closet & Dressing Unit",
    "Second Bedroom Premium Queen linens & bedside sockets",
    "Third Bedroom Twin Mattress Sets, pillows & study tables",
    "Pro-Chef Kitchen Double-Door Fridge, Exhaust, Hob & Cookers",
    "Master Jet Bath, Guest Bathroom, Powder Room faucets",
    "Triple-Zone AC Chillers & Integrated Digital Regulators",
    "Keys Set x3, Fobs x2, Building Entrance Tag & Parking Card",
    "Panoramic Balcony Glass Guard Balustrades & Outdoor Seating"
  ]
};

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateBooking
}: BookingDetailsModalProps) {
  const { settings, formatDate, formatPrice } = useGlobalSettings();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'workflow' | 'details'>('workflow');

  // Internal Notes State (Step 1 & 2 backup)
  const [internalNotes, setInternalNotes] = useState(booking.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  // Active Step Navigation (1 to 6)
  // Fallback to booking's stored workflowStep or default to 1
  const activeStep = booking.workflowStep || 1;
  const [selectedStepTab, setSelectedStepTab] = useState<number>(activeStep);

  // Update selected tab whenever the true database booking active step increments!
  useEffect(() => {
    setSelectedStepTab(activeStep);
  }, [activeStep]);

  // Sync internal notes state when booking notes change
  useEffect(() => {
    setInternalNotes(booking.notes || '');
  }, [booking.notes]);

  // ----------------------------------------------------
  // LOCAL STATES FOR VARIOUS FORMS
  // ----------------------------------------------------

  // Step 2 Form States
  const [advanceAmount, setAdvanceAmount] = useState<number>(booking.advanceBookingFee || 500);
  const [advanceStatus, setAdvanceStatus] = useState<string>(booking.advancePaidStatus || 'Pending');
  const [moveInPaidStatus, setMoveInPaidStatus] = useState<string>(booking.paymentStatus || 'unpaid');
  const [moveInContractSent, setMoveInContractSent] = useState<boolean>(booking.contractSent || false);
  const [moveInContractSigned, setMoveInContractSigned] = useState<boolean>(booking.contractSigned || false);

  // Step 3 (Check-In) Form States
  const [checkInUnitType, setCheckInUnitType] = useState<string>(booking.checkInChecklist?.unitType || '1bhk');
  const [checkInItems, setCheckInItems] = useState<Record<string, { status: 'good' | 'damaged'; notes: string }>>({});
  const [checkInGuestSig, setCheckInGuestSig] = useState<string>(booking.checkInChecklist?.guestSignature || '');
  const [checkInAgentSig, setCheckInAgentSig] = useState<string>(booking.checkInChecklist?.agentSignature || '');
  const [checkInHandoverKeys, setCheckInHandoverKeys] = useState<boolean>(booking.checkInChecklist?.keysHandedOver || false);

  // Step 4 (Decision Prep) Form States
  const [stayDecision, setStayDecision] = useState<'checkout' | 'renew' | 'extend'>(booking.stayDecision || 'checkout');
  const [renewDate, setRenewDate] = useState<string>(booking.renewalNewCheckOut || booking.checkOut);
  const [renewRent, setRenewRent] = useState<number>(booking.renewalNewRentPerMonth || booking.rentPerMonth || 1000);
  const [renewContractSigned, setRenewContractSigned] = useState<boolean>(booking.renewalContractSigned || false);
  const [extendDate, setExtendDate] = useState<string>(booking.extensionNewCheckOut || booking.checkOut);
  const [extendRate, setExtendRate] = useState<number>(booking.extensionRate || 100);
  const [extendSigned, setExtendSigned] = useState<boolean>(booking.extensionPaperworkSigned || false);

  // Step 5 (Check-Out) Form States
  const [checkOutItems, setCheckOutItems] = useState<Record<string, { status: 'good' | 'damaged'; notes: string }>>({});
  const [checkOutGuestSig, setCheckOutGuestSig] = useState<string>(booking.checkOutChecklist?.guestSignature || '');
  const [checkOutAgentSig, setCheckOutAgentSig] = useState<string>(booking.checkOutChecklist?.agentSignature || '');
  const [checkOutSigned, setCheckOutSigned] = useState<boolean>(booking.checkOutChecklist?.completed || false);

  // Step 6 (Damages & Escrow Refund) Form States
  const [damageDeduction, setDamageDeduction] = useState<number>(booking.damageDeductions || 0);
  const [damageNotes, setDamageNotes] = useState<string>(booking.damageNotes || '');
  const [refundStatus, setRefundStatus] = useState<'pending' | 'processing' | 'completed'>(booking.depositRefundedStatus || 'pending');

  // Load/initialize check-in items when checklist type changes or stays
  useEffect(() => {
    if (booking.checkInChecklist?.items) {
      setCheckInItems(booking.checkInChecklist.items);
    } else {
      // populate blank defaults based on selected unitType key
      const defaults: Record<string, { status: 'good' | 'damaged'; notes: string }> = {};
      const labels = defaultChecklists[checkInUnitType] || defaultChecklists['1bhk'];
      labels.forEach((label, idx) => {
        defaults[`item_${idx}`] = { status: 'good', notes: '' };
      });
      setCheckInItems(defaults);
    }
  }, [checkInUnitType, booking.checkInChecklist]);

  // Load/initialize check-out items based on Check-In unit type configuration
  useEffect(() => {
    const activeUnitKey = booking.checkInChecklist?.unitType || '1bhk';
    if (booking.checkOutChecklist?.items) {
      setCheckOutItems(booking.checkOutChecklist.items);
    } else {
      const defaults: Record<string, { status: 'good' | 'damaged'; notes: string }> = {};
      const labels = defaultChecklists[activeUnitKey] || defaultChecklists['1bhk'];
      labels.forEach((label, idx) => {
        // Carry over status from check-in as fallback
        const prevStatus = booking.checkInChecklist?.items?.[`item_${idx}`]?.status || 'good';
        defaults[`item_${idx}`] = { status: prevStatus, notes: '' };
      });
      setCheckOutItems(defaults);
    }
  }, [booking.checkInChecklist, booking.checkOutChecklist]);

  if (!isOpen) return null;

  // Nights count for reference
  const dateIn = new Date(booking.checkIn);
  const dateOut = new Date(booking.checkOut);
  const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
  const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  // Status Colors Mapping
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-405',
    confirmed: 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-405',
    checked_in: 'bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-405',
    checked_out: 'bg-indigo-100 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-405',
    completed: 'bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-405',
    cancelled: 'bg-red-105 dark:bg-red-950/20 text-red-700 dark:text-red-405',
  };

  const paymentStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-405',
    unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-405',
    partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-405',
  };

  const acquisitionLabels: Record<string, string> = {
    direct: 'Direct Booking',
    whatsapp: 'WhatsApp Group Link',
    airbnb: 'Airbnb Portal Sync',
    'booking.com': 'Booking.com Engine',
    other: 'Direct Offline Contract',
  };

  // ----------------------------------------------------
  // ADMINISTRATIVE SAVE SUB-ROUTINES FOR EACH STEP
  // ----------------------------------------------------

  // STEP 1 Save Callback
  const handleSaveStep1 = async () => {
    try {
      await onUpdateBooking(booking.id, {
        workflowStep: 2,
        status: 'confirmed'
      });
      setSelectedStepTab(2);
    } catch (e) {
      alert("Step 1 Transition Failed: " + (e as Error).message);
    }
  };

  // STEP 2 Save Callback
  const handleStep2Save = async (payload: {
    advanceBookingFee: number;
    advancePaidStatus: string;
    paymentStatus: string;
    contractSent: boolean;
    contractSigned: boolean;
  }) => {
    if (!payload.contractSigned) {
      alert("Please ensure the Rental Contract has been signed by the guest to proceed.");
      return;
    }
    try {
      await onUpdateBooking(booking.id, {
        workflowStep: 3,
        advanceBookingFee: payload.advanceBookingFee,
        advancePaidStatus: payload.advancePaidStatus,
        paymentStatus: payload.paymentStatus as any,
        contractSent: payload.contractSent,
        contractSigned: payload.contractSigned
      });
      setAdvanceAmount(payload.advanceBookingFee);
      setAdvanceStatus(payload.advancePaidStatus);
      setMoveInPaidStatus(payload.paymentStatus);
      setMoveInContractSent(payload.contractSent);
      setMoveInContractSigned(payload.contractSigned);
      setSelectedStepTab(3);
    } catch (e) {
      alert("Step 2 Transition Failed: " + (e as Error).message);
    }
  };

  // STEP 3 Save Callback (Inspections & Registration)
  const handleStep3Save = async (payload: {
    unitType: string;
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    keysHandedOver: boolean;
    signedAt: string;
  }) => {
    if (!payload.guestSignature.trim() || !payload.agentSignature.trim()) {
      alert("Check-in report requires digital signatures from BOTH the guest and check-in representative.");
      return;
    }
    if (!payload.keysHandedOver) {
      alert("Kindly confirm that apartment keys, swipe fobs, or physical access codes have been handed over.");
      return;
    }

    try {
      await onUpdateBooking(booking.id, {
        workflowStep: 4,
        status: 'checked_in',
        checkInChecklist: {
          unitType: payload.unitType,
          items: payload.items,
          guestSignature: payload.guestSignature,
          agentSignature: payload.agentSignature,
          keysHandedOver: payload.keysHandedOver,
          signedAt: payload.signedAt
        }
      });

      if (booking.propertyId) {
        const pRef = doc(db, 'properties', booking.propertyId);
        await updateDoc(pRef, {
          status: 'occupied',
          isAvailable: false
        });
      }

      setCheckInUnitType(payload.unitType);
      setCheckInItems(payload.items);
      setCheckInGuestSig(payload.guestSignature);
      setCheckInAgentSig(payload.agentSignature);
      setCheckInHandoverKeys(payload.keysHandedOver);
      setSelectedStepTab(4);
      alert("Check-in registered! Property marked as occupied.");
    } catch (e) {
      alert("Step 3 Checklist Registration Failed: " + (e as Error).message);
    }
  };

  // STEP 4 Save Callbacks (Renewals / Extensions)
  const handleStep4Save = async (payload: {
    stayDecision: 'checkout' | 'renew' | 'extend';
    renewalNewCheckOut?: string;
    renewalNewRentPerMonth?: number;
    renewalContractSigned?: boolean;
    extensionNewCheckOut?: string;
    extensionRate?: number;
    extensionPaperworkSigned?: boolean;
  }) => {
    try {
      if (payload.stayDecision === 'renew') {
        if (!payload.renewalContractSigned) {
          alert("A standard lease renewal requires a freshly signed contract.");
          return;
        }
        await onUpdateBooking(booking.id, {
          checkOut: payload.renewalNewCheckOut,
          rentPerMonth: payload.renewalNewRentPerMonth,
          stayDecision: 'renew',
          renewalNewCheckOut: payload.renewalNewCheckOut,
          renewalNewRentPerMonth: payload.renewalNewRentPerMonth,
          renewalContractSigned: payload.renewalContractSigned,
          workflowStep: 5
        });
        setStayDecision('renew');
        if (payload.renewalNewCheckOut) setRenewDate(payload.renewalNewCheckOut);
        if (payload.renewalNewRentPerMonth) setRenewRent(payload.renewalNewRentPerMonth);
        setRenewContractSigned(true);
        alert(`Reservation renewed successfully! New check-out date set to ${payload.renewalNewCheckOut}`);
      } else if (payload.stayDecision === 'extend') {
        if (!payload.extensionPaperworkSigned) {
          alert("Proof of supplementary extension payment agreement signature required.");
          return;
        }
        const extRate = payload.extensionRate || 0;
        await onUpdateBooking(booking.id, {
          checkOut: payload.extensionNewCheckOut,
          stayDecision: 'extend',
          extensionNewCheckOut: payload.extensionNewCheckOut,
          extensionRate: extRate,
          extensionPaperworkSigned: payload.extensionPaperworkSigned,
          totalPrice: (booking.totalPrice || 0) + extRate,
          grandTotalAmount: (booking.grandTotalAmount || 0) + extRate,
          workflowStep: 5
        });
        setStayDecision('extend');
        if (payload.extensionNewCheckOut) setExtendDate(payload.extensionNewCheckOut);
        if (payload.extensionRate) setExtendRate(extRate);
        setExtendSigned(true);
        alert(`Stay extended successfully! New checkout date set to ${payload.extensionNewCheckOut}`);
      } else {
        await onUpdateBooking(booking.id, {
          workflowStep: 5,
          stayDecision: 'checkout'
        });
        setStayDecision('checkout');
        alert("Scheduled checkout confirmed. Exit checklists are now ready.");
      }
      setSelectedStepTab(5);
    } catch (e) {
      alert("Step 4 Decision Processing Failed: " + (e as Error).message);
    }
  };

  // STEP 5 Save Callback (Exit Checkout Report)
  const handleStep5Save = async (payload: {
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    completed: boolean;
    signedAt: string;
  }) => {
    if (!payload.guestSignature.trim() || !payload.agentSignature.trim()) {
      alert("Checkout inspection document requires signatures from both the guest and exit checking representative.");
      return;
    }
    try {
      await onUpdateBooking(booking.id, {
        workflowStep: 6,
        status: 'checked_out',
        checkOutChecklist: {
          items: payload.items,
          guestSignature: payload.guestSignature,
          agentSignature: payload.agentSignature,
          completed: payload.completed,
          signedAt: payload.signedAt
        }
      });

      if (booking.propertyId) {
        const pRef = doc(db, 'properties', booking.propertyId);
        await updateDoc(pRef, {
          status: 'maintenance',
          isAvailable: false
        });
      }

      setCheckOutItems(payload.items);
      setCheckOutGuestSig(payload.guestSignature);
      setCheckOutAgentSig(payload.agentSignature);
      setCheckOutSigned(payload.completed);
      setSelectedStepTab(6);
      alert("Check-out registered successfully! Ready for damages evaluation.");
    } catch (e) {
      alert("Step 5 Exit Inspection Failed: " + (e as Error).message);
    }
  };

  // STEP 6 Save Callback (Financially close out escrow & dispatch cleaners)
  const handleStep6Save = async (payload: {
    damageDeductions: number;
    damageNotes: string;
    depositRefundedStatus: 'pending' | 'processing' | 'completed';
    completedAt: string;
  }) => {
    try {
      await onUpdateBooking(booking.id, {
        status: 'completed',
        damageDeductions: payload.damageDeductions,
        damageNotes: payload.damageNotes,
        depositRefundedStatus: payload.depositRefundedStatus,
        paymentStatus: 'paid'
      });

      if (booking.propertyId) {
        const pRef = doc(db, 'properties', booking.propertyId);
        await updateDoc(pRef, {
          status: 'available',
          isAvailable: true
        });

        // Dispatch turnover service cleaning ticket
        await addDoc(collection(db, 'turnovers'), {
          propertyId: booking.propertyId,
          propertyTitle: booking.propertyTitle || 'Property Unit',
          referenceNo: booking.propertyRef || booking.propertyId.slice(0, 6),
          status: 'pending_cleaning',
          notes: `Automated turnover triggered after Step 6 settlement. Damage deductions: AED ${payload.damageDeductions}. Remarks: ${payload.damageNotes || 'No critical damages noted.'}`,
          createdAt: serverTimestamp()
        });
      }

      setDamageDeduction(payload.damageDeductions);
      setDamageNotes(payload.damageNotes);
      setRefundStatus(payload.depositRefundedStatus);

      alert("Lifecycle stay complete! Cleaning dispatch ticket queued for maintenance teams.");
      onClose();
    } catch (e) {
      alert("Step 6 Finalization Failed: " + (e as Error).message);
    }
  };

  // Quick fallback notes updater
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(booking.id, internalNotes);
    } catch (e) {
      alert("Notes update failed: " + (e as Error).message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Calculate side-by-side differences for comparing Step 3 (check-in) vs Step 5 (check-out)
  const renderDamagesComparison = () => {
    const activeUnitKey = booking.checkInChecklist?.unitType || '1bhk';
    const labels = defaultChecklists[activeUnitKey] || defaultChecklists['1bhk'];
    const issues: Array<{ label: string; inStatus: string; inNote: string; outStatus: string; outNote: string }> = [];

    labels.forEach((label, idx) => {
      const inItem = checkInItems[`item_${idx}`];
      const outItem = checkOutItems[`item_${idx}`];
      if (inItem && outItem) {
        // Highlight cases where item was perfect at check-in but damaged at check-out, or check-out notes specify issues
        const statusDiff = inItem.status === 'good' && outItem.status === 'damaged';
        const notesDiff = outItem.notes.trim() !== '' && outItem.notes !== inItem.notes;
        if (statusDiff || notesDiff || outItem.status === 'damaged') {
          issues.push({
            label,
            inStatus: inItem.status,
            inNote: inItem.notes || 'None',
            outStatus: outItem.status,
            outNote: outItem.notes || 'No remarks provided'
          });
        }
      }
    });

    if (issues.length === 0) {
      return (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-extrabold rounded-2xl flex items-center gap-2 text-xs border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle2 size={16} />
          <span>Complete Audit match: No newly reported exit damages detected during side-by-side review!</span>
        </div>
      );
    }

    return (
      <div className="space-y-3 bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-3xl border border-rose-150-dark dark:border-rose-900/40">
        <h4 className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1">
          <ShieldAlert size={14} />
          <span>Active Exit Damage Mismatches Found:</span>
        </h4>
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-950 p-3.5 rounded-2xl border border-rose-200/40 dark:border-rose-900/30 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="block font-extrabold text-zinc-900 dark:text-white mb-2">{issue.label}</span>
              <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black text-zinc-400">
                <div className="bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-150">
                  <span className="text-blue-500 block mb-0.5">At Check-In</span>
                  <span className="text-zinc-800 dark:text-white font-extrabold">{issue.inStatus.toUpperCase()}</span>
                  <p className="text-[10px] text-zinc-500 mt-1 capitalize font-medium font-sans italic">{issue.inNote}</p>
                </div>
                <div className="bg-rose-50/30 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100">
                  <span className="text-rose-500 block mb-0.5">At Check-Out</span>
                  <span className="text-rose-700 dark:text-rose-400 font-extrabold">{issue.outStatus.toUpperCase()}</span>
                  <p className="text-[10px] text-rose-600 dark:text-rose-300 mt-1 capitalize font-medium font-sans font-sans italic">{issue.outNote}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Stepper elements definitions
  const stepsList = [
    { no: 1, label: "Booking / الحجز" },
    { no: 2, label: "Contract / العقود" },
    { no: 3, label: "Check-In / الدخول" },
    { no: 4, label: "Decision / القرارات" },
    { no: 5, label: "Check-Out / الخروج" },
    { no: 6, label: "Escrow / الوديعة" }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto select-none">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/70 backdrop-blur-md"
      />

      {/* Modal surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-color,theme(colors.purple.500))] bg-purple-50 dark:bg-purple-950/30 px-3 py-1 rounded-full">
                stay manager
              </span>
              <span className="text-[10px] font-mono font-black text-zinc-400">
                #{booking.id.slice(0, 10).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1.5 leading-none">
              Stay & Itinerary Lifecycle Dashboard
            </h2>
          </div>
          <button
            title="Close stay details screen"
            type="button"
            onClick={onClose}
            className="p-3 text-zinc-450 dark:text-zinc-550 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection links */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'workflow'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            <Activity size={14} />
            <span>Itinerary Workflow Engine</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            <FileText size={14} />
            <span>Reservation Profile & Invoice</span>
          </button>
        </div>

        {/* Dynamic Inner body viewport container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* TAB A: THE NEW INVENTED LIFECYCLE WORKFLOW STEPPER */}
            {activeTab === 'workflow' && (
              <motion.div
                key="workflow-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* 6-Step Visual Indicators Progress Tracker */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-[2rem] border border-zinc-100 dark:border-zinc-850">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Lifecycle steps progression / مراحل سير الحجز والإقامة</span>
                    <span className="text-xs font-black text-brand italic">
                      Active Operational Step: {activeStep} of 6
                    </span>
                  </div>

                  {/* Horizontal progress indicators */}
                  <div className="flex items-center justify-between gap-2.5 flex-wrap md:flex-nowrap">
                    {stepsList.map((st, idx) => {
                      const isCompleted = st.no < activeStep;
                      const isActive = st.no === activeStep;
                      const isSelected = st.no === selectedStepTab;

                      return (
                        <div key={idx} className="flex-1 flex items-center gap-1.5 min-w-[110px]">
                          <button
                            type="button"
                            onClick={() => setSelectedStepTab(st.no)}
                            className={`flex items-center gap-1.5 text-left py-1.5 px-2.5 rounded-xl transition-all cursor-pointer font-bold ${
                              isSelected 
                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 ring-2 ring-brand/35'
                                : isActive
                                ? 'bg-brand/10 text-brand border border-brand/20'
                                : isCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-extrabold'
                                : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 dark:text-zinc-500'
                            }`}
                          >
                            <span className="text-xs font-black shrink-0">
                              {isCompleted ? '✓' : st.no}
                            </span>
                            <span className="text-[10px] tracking-tight uppercase truncate max-w-[80px]">
                              {st.label}
                            </span>
                          </button>
                          {idx < stepsList.length - 1 && (
                            <ChevronRight size={12} className="text-zinc-350 dark:text-zinc-600 hidden md:block" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE FOCUSING STEP INSTRUCTION & USER INTERFACE FORMS */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-850 rounded-[2rem] space-y-5">
                  <div className="flex items-start gap-3.5 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl">
                      {selectedStepTab === 1 && <FileText size={18} />}
                      {selectedStepTab === 2 && <CreditCard size={18} />}
                      {selectedStepTab === 3 && <ClipboardList size={18} />}
                      {selectedStepTab === 4 && <PenTool size={18} />}
                      {selectedStepTab === 5 && <ClipboardList size={18} />}
                      {selectedStepTab === 6 && <ShieldAlert size={18} />}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-zinc-400">Step {selectedStepTab} instructions</span>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                        {selectedStepTab === 1 && "Confirm Guest Booking Intake Parameters"}
                        {selectedStepTab === 2 && "Collection & Move-in Administration"}
                        {selectedStepTab === 3 && "Unit Check-In Inventory Report & Sign-Off"}
                        {selectedStepTab === 4 && "Scheduled Departure & Renewal Prep"}
                        {selectedStepTab === 5 && "Unit Exit Inspection Report & Sign-Off"}
                        {selectedStepTab === 6 && "Security Escrow Closeout & Clean Dispatch"}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mt-1 max-w-2xl leading-relaxed">
                        {selectedStepTab === 1 && "Verify staying period, occupant profile and financial rates setup are in perfect order."}
                        {selectedStepTab === 2 && "Collect advance security fee/rent. Confirm the holiday home lease contract has been sent and signed."}
                        {selectedStepTab === 3 && "Select unit layout to configure pre-set checklists. Sign off the condition side-by-side with checked items."}
                        {selectedStepTab === 4 && "Differentiate on-time exits from extensions (<1 month) or full renewals (>=1 month) with automated rent increments."}
                        {selectedStepTab === 5 && "Examine assets with direct side-by-side comparison reference lists of physical check-in states."}
                        {selectedStepTab === 6 && "Apply damage escrow deductions based on comparison mismatch report and release the cleanup turnover team."}
                      </p>
                    </div>
                  </div>

                  {/* FORM RENDERINGS BY SELECTING TAB */}
                  <div className="space-y-4">

                    <Step1ProfileVerification 
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      diffNights={diffNights}
                      statusColors={statusColors}
                      onNext={handleSaveStep1}
                    />

                    <Step2FinanceChecklist
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      diffNights={diffNights}
                      onSave={handleStep2Save}
                    />

                    <Step3CheckInInspection
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      defaultChecklists={defaultChecklists}
                      onSave={handleStep3Save}
                    />

                    <Step4StayDecision
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      onSave={handleStep4Save}
                    />

                    <Step5CheckOutInspection
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      defaultChecklists={defaultChecklists}
                      onSave={handleStep5Save}
                    />

                    <Step6DamagesSettlement
                      booking={booking}
                      activeStep={activeStep}
                      selectedStepTab={selectedStepTab}
                      onSave={handleStep6Save}
                    />

                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB B: ORIGINAL COMPREHENSIVE GUEST RECEIPT / METRICS */}
            {activeTab === 'details' && (
              <motion.div
                key="details-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Status indicator overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                    <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Stay Status</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[booking.status || 'pending'] || 'bg-zinc-100 text-zinc-650'}`}>
                      {(booking.status || 'pending').replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                    <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Financial State</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${paymentStatusColors[booking.paymentStatus || 'unpaid'] || 'bg-zinc-100 text-zinc-650'}`}>
                      {(booking.paymentStatus || 'unpaid').replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                    <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Acquisition Source</span>
                    <span className="text-xs font-black text-zinc-850 dark:text-zinc-200 block truncate">
                      {acquisitionLabels[booking.source] || (booking.source || 'Direct').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Accommodation Title stay details */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">Accommodation Premises</h3>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <p className="text-base font-black text-zinc-900 dark:text-white">
                        {booking.propertyTitle || 'Property Unit'}
                      </p>
                      <p className="text-xs text-zinc-500 font-bold mt-1">
                        Apartment ID Reference: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-black">{booking.propertyRef || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
                    <div>
                      <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400">Check-In</span>
                      <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase mt-1">
                        <Calendar size={13} className="text-zinc-450 shrink-0" />
                        <span>{new Date(booking.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400">Check-Out</span>
                      <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase mt-1">
                        <Calendar size={13} className="text-zinc-450 shrink-0" />
                        <span>{new Date(booking.checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right mt-3">
                    Total Duration: {diffNights} {diffNights === 1 ? 'Night' : 'Nights'}
                  </p>
                </div>

                {/* Guest Contact info */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">Guest Contacts</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-zinc-500">Contact Identity:</span>
                      <span className="text-xs font-black text-zinc-850 dark:text-zinc-150">{booking.guestName}</span>
                    </div>
                    
                    {booking.guestEmail && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-zinc-500">Email Address:</span>
                        <a
                          href={`mailto:${booking.guestEmail}`}
                          className="flex items-center gap-1 text-xs font-black text-brand hover:underline"
                        >
                          <Mail size={12} />
                          <span>{booking.guestEmail}</span>
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-zinc-500">Direct Mobile:</span>
                      <div className="flex items-center gap-1 text-xs font-black text-zinc-800 dark:text-zinc-200">
                        <Phone size={12} className="text-zinc-400" />
                        <span>{booking.guestPhone || 'N/A'}</span>
                      </div>
                    </div>

                    {booking.guestPhone && (
                      <div className="flex justify-end pt-1">
                        <a
                          href={`https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wide transition-colors"
                        >
                          <span>Message On WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing summary details */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1 block">Financial Summary & Fee Structure</h3>
                  
                  {booking.rentPerMonth ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between font-bold text-zinc-650 dark:text-zinc-400 border-b border-zinc-200/40 dark:border-zinc-800 pb-1.5">
                        <span>Monthly Rent:</span>
                        <span>AED {booking.rentPerMonth} / month × {booking.billingMonths || 1} months</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-zinc-500 font-bold">
                        {!!booking.dtcmFee && (
                          <div className="flex justify-between">
                            <span>DTCM tourism fee:</span>
                            <span>AED {booking.dtcmFee}</span>
                          </div>
                        )}
                        {!!booking.agencyFee && (
                          <div className="flex justify-between">
                            <span>Processing Agency fee:</span>
                            <span>AED {booking.agencyFee}</span>
                          </div>
                        )}
                        {!!booking.securityDeposit && (
                          <div className="flex justify-between">
                            <span>Refundable Deposit Escrow:</span>
                            <span>AED {booking.securityDeposit}</span>
                          </div>
                        )}
                        {!!booking.cleaningFee && (
                          <div className="flex justify-between">
                            <span>Standard Exit Clean:</span>
                            <span>AED {booking.cleaningFee}</span>
                          </div>
                        )}
                        {!!booking.miscFee && (
                          <div className="flex justify-between">
                            <span>Miscellaneous Fees:</span>
                            <span>AED {booking.miscFee}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between font-black text-zinc-850 dark:text-zinc-200 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span>Invoice Grand Total:</span>
                        <span className="text-sm text-zinc-900 dark:text-white flex items-center gap-1 font-mono">
                          AED {booking.grandTotalAmount || booking.totalPrice}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-zinc-500 font-bold">
                        <span>Nightly Total Stays:</span>
                        <span>{diffNights} nights x <CurrencySymbol />{Math.round(booking.totalPrice / (diffNights || 1))} avg</span>
                      </div>
                      <div className="flex justify-between font-black text-zinc-850 dark:text-zinc-200 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                        <span>Gross invoice value:</span>
                        <span className="text-sm text-zinc-900 dark:text-white font-mono">
                          <CurrencySymbol />{booking.totalPrice}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Internal host annotations note area */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <FileText size={12} />
                      <span>Host annotations</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="flex items-center gap-1 px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 rounded-xl text-[10px] uppercase font-black tracking-wide transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Enter general private notes, key codes, special arrangements..."
                    className="w-full p-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none"
                  />
                </div>

                {/* Print Corporate Invoice action button */}
                <div className="p-4 bg-zinc-50 border border-zinc-150-dark dark:bg-zinc-950 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500">Need corporate invoice records?</span>
                  <button
                    type="button"
                    onClick={() => setShowInvoice(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 transition-all rounded-xl text-[10px] font-black tracking-wider uppercase cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>View & Print Official Invoice</span>
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      {/* Corporate Letterhead Invoice Overlay popup */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto font-sans">
          <div 
            className="bg-white text-zinc-950 w-full max-w-3xl rounded-3xl shadow-2xl relative print:shadow-none print:rounded-none flex flex-col justify-between min-h-[750px] overflow-hidden print:block"
            style={{
              paddingTop: `${settings.letterheadMarginTop ?? 20}px`,
              paddingBottom: `${settings.letterheadMarginBottom ?? 20}px`,
              paddingLeft: `${settings.letterheadMarginLeft ?? 25}px`,
              paddingRight: `${settings.letterheadMarginRight ?? 25}px`,
            }}
          >
            
            {/* Action buttons (hidden on print) */}
            <div className="absolute top-4 right-4 flex gap-2 print:hidden z-20">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer size={14} /> Print / Save PDF
              </button>
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Custom Background Letterhead PNG Background */}
            {settings.letterheadImageUrl ? (
              <div 
                className="absolute inset-0 pointer-events-none z-0" 
                style={{ 
                  backgroundImage: `url(${settings.letterheadImageUrl})`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }} 
              />
            ) : (
              <div className="absolute inset-0 pointer-events-none z-0 bg-zinc-50/10 flex items-center justify-center border border-dashed border-zinc-205 print:hidden">
                <span className="text-[11px] uppercase tracking-wider text-zinc-300 font-extrabold">No custom png letterhead configured</span>
              </div>
            )}

            {/* Base Company Receipt Header Info overlaid on the layout nicely */}
            <div className="border-b border-zinc-150 pb-4 z-10 flex justify-between items-end">
              <div>
                <h1 className="text-base font-black tracking-tight" style={{ color: settings.customBrandColor }}>
                  {settings.companyName || 'Authentic Holiday Homes LLC'}
                </h1>
                <p className="text-[10px] text-zinc-550 font-bold tracking-wide mt-1">
                  Tax TRN: <span className="text-zinc-800 font-bold">{settings.trn || 'XXXXXXXXX'}</span> | License: <span className="text-zinc-800 font-bold">{settings.licenseNumber || 'XXXXXXX'}</span>
                </p>
              </div>
              <div className="text-right text-[10px] text-zinc-500 max-w-[200px]">
                <p className="whitespace-pre-line leading-tight">{settings.address}</p>
              </div>
            </div>

            {/* Doc Invoice Body */}
            <div className="my-6 z-10 space-y-5 flex-1 block">
              <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div>
                  <h2 className="text-xs font-black tracking-tight text-zinc-850 uppercase font-sans">OFFICIAL STAY LEASE RECEIPT</h2>
                  <p className="text-[9px] font-mono text-zinc-505 mt-0.5">Reference ID: <span className="text-zinc-800 font-bold">{booking.id.toUpperCase()}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Date Issued</p>
                  <p className="text-xs font-black text-zinc-850 mt-1">{formatDate(new Date())}</p>
                </div>
              </div>

              {/* Guest & Property stay details card */}
              <div className="grid grid-cols-2 gap-6 text-[11px] text-zinc-600 leading-normal bg-zinc-50 py-4 px-5 rounded-2xl border border-zinc-100">
                <div>
                  <h3 className="font-black text-zinc-400 uppercase tracking-wider text-[9px] mb-2">GUEST OCCUPANT</h3>
                  <p className="font-semibold"><span className="text-zinc-700">Resident Name:</span> {booking.guestName}</p>
                  {booking.guestPhone && <p><span className="text-zinc-700">Contact Mobile:</span> {booking.guestPhone}</p>}
                  {booking.guestEmail && <p><span className="text-zinc-700">Email Address:</span> {booking.guestEmail}</p>}
                </div>
                <div>
                  <h3 className="font-black text-zinc-400 uppercase tracking-wider text-[9px] mb-2">STAY SPECIFICS</h3>
                  <p className="font-semibold"><span className="text-zinc-700">Holiday Unit:</span> {booking.propertyTitle || 'Holiday Home Unit'}</p>
                  <p><span className="text-zinc-700">Lease Reference:</span> {booking.propertyRef || 'N/A'}</p>
                  <p><span className="text-zinc-700">Staying Itinerary:</span> {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)} ({diffNights} nights)</p>
                </div>
              </div>

              {/* Invoice Itemized table */}
              <div className="pt-2 select-text">
                {booking.rentPerMonth ? (
                  <div className="space-y-4">
                    <table className="w-full text-xs text-zinc-700 border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400 text-left">
                          <th className="py-2">Operational Item Description</th>
                          <th className="py-2 text-right">Rent monthly Rate</th>
                          <th className="py-2 text-right">Quantity / Months</th>
                          <th className="py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-100 font-semibold">
                          <td className="py-3 text-zinc-850">Base Monthly Rent - Luxe Listing Stay</td>
                          <td className="py-3 text-right font-mono font-bold">{formatPrice(booking.rentPerMonth)}</td>
                          <td className="py-3 text-right font-semibold">{booking.billingMonths || 1} months</td>
                          <td className="py-3 text-right font-mono font-extrabold">{formatPrice(booking.rentPerMonth * (booking.billingMonths || 1))}</td>
                        </tr>
                        {!!booking.dtcmFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Tourism Dirham Fee (DTCM Approved)</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.dtcmFee)}</td>
                          </tr>
                        )}
                        {!!booking.agencyFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Agency Processing & Admin Fee</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.agencyFee)}</td>
                          </tr>
                        )}
                        {!!booking.securityDeposit && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-650">
                            <td className="py-2 font-semibold">Refundable Guest Security Deposit</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Held in escrow</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.securityDeposit)}</td>
                          </tr>
                        )}
                        {!!booking.cleaningFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Exit Cleaning & Sanitization Service</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.cleaningFee)}</td>
                          </tr>
                        )}
                        {!!booking.miscFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Miscellaneous Supplementary Services</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.miscFee)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <table className="w-full text-xs text-zinc-700 border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400 text-left">
                        <th className="py-2">Short-Term Vacation Description</th>
                        <th className="py-2 text-center">Nights</th>
                        <th className="py-2 text-right">Nightly Price</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100">
                        <td className="py-3 font-semibold text-zinc-850">
                          Luxury Accommodation Stay at [{booking.propertyTitle || 'Holiday Home Unit'}]
                        </td>
                        <td className="py-3 text-center font-semibold">{diffNights}</td>
                        <td className="py-3 text-right font-mono font-bold">{formatPrice(Math.round(booking.totalPrice / (diffNights || 1)))}</td>
                        <td className="py-3 text-right font-mono font-extrabold">{formatPrice(booking.totalPrice)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-[10px] text-zinc-400 italic" colSpan={2}>
                          Includes tourism dirham fees, utility charges, and service handling. Fully compliant under DTCM regulation parameters.
                        </td>
                        <td className="py-3 text-right font-bold text-zinc-400 text-[10px]">VAT Inclusive Rate:</td>
                        <td className="py-3 text-right font-mono text-zinc-500 text-[10px]">5.0%</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Total Summary */}
              <div className="flex flex-col items-end pt-4 border-t border-zinc-100 space-y-1">
                <div className="flex justify-between w-64 text-xs font-bold">
                  <span className="text-zinc-505">Gross Pricing Subtotal:</span>
                  <span className="font-mono text-zinc-700">{formatPrice(booking.grandTotalAmount || booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between w-64 text-xs font-black text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-xs font-extrabold leading-none" style={{ color: settings.customBrandColor }}>{formatPrice(booking.grandTotalAmount || booking.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Letterhead Footer */}
            <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-400 z-10 flex justify-between items-center font-semibold">
              <span>Hotline support: {settings.phone}</span>
              <span>General email: {settings.email}</span>
              <span className="font-bold text-zinc-650 uppercase tracking-widest">{settings.website}</span>
            </div>

            {/* print-override layout style declarations */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .print\\:block, .print\\:block * {
                  visibility: visible !important;
                }
                .fixed {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}} />

          </div>
        </div>
      )}
    </div>
  );
}
