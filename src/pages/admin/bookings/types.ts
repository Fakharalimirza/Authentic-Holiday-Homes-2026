export interface BookingPaymentInstallment {
  payment_no: number;
  due_date: string;
  description: string;
  amount: number;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
}

export interface AdminBooking {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  propertyRef?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone: string;
  totalPrice: number; // maps to grandTotalAmount
  paymentStatus: 'paid' | 'unpaid' | 'partially_paid' | 'overdue' | 'refunded' | 'deposit_held' | 'deposit_refunded';
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out' | 'completed';
  source: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;

  // Real-world dynamic stay values according to system guidelines
  numberOfStayDays?: number;
  calculatedNumberofMonths?: number;
  billingMonths?: number;
  rentPerMonth?: number;
  dtcmFee?: number;
  agencyFee?: number;
  securityDeposit?: number;
  cleaningFee?: number;
  miscFee?: number;
  firstMonthTotal?: number;
  nextMonthTotal?: number;
  grandTotalAmount?: number;
  paymentSchedule?: BookingPaymentInstallment[];
  specialTermsAndConditions?: string;
  customMonthlyRents?: number[];

  // Stay Lifecycle workflow state fields
  workflowStep?: number;
  advanceBookingFee?: number;
  advancePaidStatus?: string;
  contractSent?: boolean;
  contractSigned?: boolean;
  checkInChecklist?: {
    unitType: string;
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    keysHandedOver: boolean;
    signedAt: string;
  };
  stayDecision?: 'checkout' | 'renew' | 'extend';
  renewalNewCheckOut?: string;
  renewalNewRentPerMonth?: number;
  renewalContractSigned?: boolean;
  extensionNewCheckOut?: string;
  extensionRate?: number;
  extensionPaperworkSigned?: boolean;
  checkOutChecklist?: {
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    completed: boolean;
    signedAt: string;
  };
  damageDeductions?: number;
  damageNotes?: string;
  depositRefundedStatus?: 'pending' | 'processing' | 'completed';
}

export interface BookingFiltersState {
  searchQuery: string;
  status: string; // 'all' or specific status
  propertyId: string; // 'all' or specific property
  source: string; // 'all' or specific source
}

export interface BookingStats {
  totalRevenue: number;
  completedStays: number;
  pendingReviews: number;
  confirmedStays: number;
  cancelledCount: number;
}
