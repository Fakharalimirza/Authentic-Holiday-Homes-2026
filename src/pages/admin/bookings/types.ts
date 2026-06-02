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
  source: 'direct' | 'whatsapp' | 'airbnb' | 'booking.com' | 'other';
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
