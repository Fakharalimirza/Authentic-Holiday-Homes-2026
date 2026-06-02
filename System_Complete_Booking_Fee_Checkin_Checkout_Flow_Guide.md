# System Complete Booking, Fee Collection, Check-In, Check-Out, Cleaning, Maintenance & Availability Flow Guide

## Purpose

This document explains the complete System flow in a way an AI model, developer, or automation system can understand.

The System should manage:

1. Booking creation
2. Guest stay period
3. Fee collection and payment breakdown
4. Monthly rent calculation
5. First-month payment calculation
6. Recurring monthly payment calculation
7. Check-in process
8. Check-out process
9. Apartment status updates
10. Cleaning after checkout
11. Maintenance after checkout
12. Moving the apartment back to the availability list

The most important rule is:

> A booking controls the guest stay, but apartment availability depends on booking status, cleaning status, maintenance status, and inspection status.

---

# 1. Core System Concept

The System manages the full lifecycle of a rental apartment.

The normal apartment flow is:

```text
Available
→ Reserved
→ Occupied
→ Checked Out
→ Cleaning Required
→ Under Cleaning
→ Inspection Pending
→ Maintenance Required, if needed
→ Ready
→ Available
```

The system should never move an apartment directly from:

```text
Checked Out → Available
```

Correct flow is:

```text
Checked Out
→ Cleaning Required
→ Under Cleaning
→ Inspection Pending
→ Ready
→ Available
```

---

# 2. Main System Entities

## 2.1 Booking Entity

A booking represents the guest reservation.

Example booking object:

```json
{
  "booking_id": "BK-1001",
  "guest_name": "John Smith",
  "guest_phone": "+971500000000",
  "guest_email": "guest@example.com",

  "apartment_id": "APT-1204",
  "building": "Marina Tower",
  "unit_number": "1204",

  "booking_source": "Direct / Agent / Airbnb / Booking.com / Website",
  "created_by_agent_id": "AG-001",

  "check_in_date": "2026-06-01",
  "check_out_date": "2026-08-31",
  "number_of_stay_days": 92,
  "number_of_stay_months": 3,

  "booking_status": "Confirmed",
  "payment_status": "Pending / Partial / Paid",
  "documents_status": "Pending / Submitted / Verified",
  "access_status": "Not Sent / Sent / Active / Expired",

  "special_terms_and_conditions": "Guest will pay DEWA separately.",

  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 2.2 Apartment Entity

An apartment represents the physical unit.

Example apartment object:

```json
{
  "apartment_id": "APT-1204",
  "unit_number": "1204",
  "building": "Marina Tower",

  "apartment_status": "Available",
  "availability_status": "Available",

  "current_booking_id": null,
  "next_booking_id": null,

  "cleaning_status": "Clean",
  "maintenance_status": "Clear",
  "inspection_status": "Passed",

  "last_checkout_date": null,
  "next_checkin_date": null
}
```

---

## 2.3 Fee Breakdown Entity

Each booking must have a clear fee breakdown.

When an agent creates a booking, the system must show fee fields so the agent can enter all required charges.

Example fee object:

```json
{
  "booking_id": "BK-1001",

  "rent_per_month": 8000,
  "number_of_stay_days": 92,
  "calculated_number_of_months": 3,
  "calculated_rent_total": 24000,

  "dtcm_fee": 900,
  "agency_fee": 4000,
  "security_deposit": 3000,
  "cleaning_fee": 500,
  "misc_fee": 250,

  "first_month_total": 16650,
  "remaining_monthly_rent": 8000,
  "grand_total_amount": 32650,

  "payment_status": "Pending",
  "remarks": "Security deposit refundable after checkout inspection."
}
```

---

# 3. Booking Creation Flow

## Step 1: Agent Starts Booking

The agent creates a new booking from the System dashboard.

The system must ask the agent to enter:

| Field | Required | Description |
|---|---:|---|
| Guest name | Yes | Full guest name |
| Guest phone | Yes | Guest mobile number |
| Guest email | Optional | Guest email |
| Apartment | Yes | Selected apartment/unit |
| Check-in date | Yes | Start date of stay |
| Check-out date | Yes | End date of stay |
| Booking source | Yes | Direct, Agent, Airbnb, Website, etc. |
| Special terms/comments | Optional | Any custom condition or agreement |

---

## Step 2: Define Guest Stay

The agent must define the guest stay by entering:

```text
Check-in date
Check-out date
```

The system must automatically calculate:

```text
Number of stay days = check_out_date - check_in_date
```

Example:

```text
Check-in date: 2026-06-01
Check-out date: 2026-08-31

Number of stay days: 92 days
```

The system may also calculate an estimated stay month value.

Recommended logic:

```pseudo
number_of_stay_days = check_out_date - check_in_date

calculated_number_of_months = ceil(number_of_stay_days / 30)
```

Example:

```text
92 stay days / 30 = 3.06
Rounded up = 4 months, if using full-month billing
```

However, if the business wants calendar-month billing, the system should allow the agent/admin to manually adjust the number of billing months.

Recommended fields:

```json
{
  "number_of_stay_days": 92,
  "system_calculated_months": 4,
  "agent_selected_billing_months": 3
}
```

This gives flexibility because monthly rental agreements may not always follow exact 30-day calculations.

---

# 4. Fee Collection During Booking Creation

## 4.1 Fee Fields Agent Must Fill

When the agent creates the booking, the System must generate a payment section with the following fields:

| Fee Field | Required | Description |
|---|---:|---|
| Rent per month | Yes | Custom rent amount entered by agent |
| DTCM fee | Optional/Required based on business rule | Tourism/municipality-related charge |
| Agency fee | Optional | Agent/company service fee |
| Security deposit | Optional/Required | Refundable deposit, if applicable |
| Cleaning fee | Optional/Required | Checkout or move-in cleaning charge |
| Misc fee | Optional | Any other custom charge |
| Total amount | Auto-calculated | Total payable amount |
| Comments / Terms | Optional | Specific agreement, condition, or exception |

The system should not hide these fields. They should be visible during booking creation.

---

## 4.2 Fee Input Example

Example booking fee entry:

```json
{
  "rent_per_month": 8000,
  "dtcm_fee": 900,
  "agency_fee": 4000,
  "security_deposit": 3000,
  "cleaning_fee": 500,
  "misc_fee": 250,
  "special_terms_and_conditions": "Tenant will pay internet charges separately."
}
```

---

## 4.3 Total Rent Calculation

The system should calculate total rent based on:

```text
Rent per month × Number of billing months
```

Example:

```text
Rent per month = AED 8,000
Billing months = 3

Total rent = AED 8,000 × 3
Total rent = AED 24,000
```

Pseudo logic:

```pseudo
total_rent = rent_per_month * billing_months
```

---

## 4.4 Grand Total Amount Calculation

Grand total should include:

```text
Total Rent
+ DTCM Fee
+ Agency Fee
+ Security Deposit
+ Cleaning Fee
+ Misc Fee
```

Pseudo logic:

```pseudo
grand_total_amount =
    total_rent
    + dtcm_fee
    + agency_fee
    + security_deposit
    + cleaning_fee
    + misc_fee
```

Example:

```text
Total Rent: AED 24,000
DTCM Fee: AED 900
Agency Fee: AED 4,000
Security Deposit: AED 3,000
Cleaning Fee: AED 500
Misc Fee: AED 250

Grand Total = AED 32,650
```

---

# 5. First-Month and Next-Month Payment Rule

## 5.1 Main Business Rule

The first month payment should include:

```text
First Month Rent
+ DTCM Fee
+ Agency Fee
+ Security Deposit
+ Cleaning Fee
+ Misc Fee
```

The next month payments should include only the remaining rent unless any extra fee is manually added.

In simple words:

> First month includes everything. Next month includes only rent or remaining rent.

---

## 5.2 First Month Payment Calculation

Formula:

```pseudo
first_month_total =
    rent_per_month
    + dtcm_fee
    + agency_fee
    + security_deposit
    + cleaning_fee
    + misc_fee
```

Example:

```text
Rent per month: AED 8,000
DTCM fee: AED 900
Agency fee: AED 4,000
Security deposit: AED 3,000
Cleaning fee: AED 500
Misc fee: AED 250

First month total:
AED 8,000 + 900 + 4,000 + 3,000 + 500 + 250
= AED 16,650
```

---

## 5.3 Next Month Payment Calculation

Formula:

```pseudo
next_month_total = rent_per_month
```

Example:

```text
Second month payment = AED 8,000
Third month payment = AED 8,000
```

If there are additional monthly recurring fees, the system can allow optional recurring fee fields.

Example optional fields:

```json
{
  "monthly_utility_fee": 0,
  "monthly_internet_fee": 0,
  "monthly_parking_fee": 0
}
```

Then:

```pseudo
next_month_total =
    rent_per_month
    + monthly_utility_fee
    + monthly_internet_fee
    + monthly_parking_fee
```

If no recurring fee is added:

```pseudo
next_month_total = rent_per_month
```

---

# 6. Payment Schedule Generation

After the agent enters booking dates and fee details, the system should generate a payment schedule.

## 6.1 Payment Schedule Example

Guest stay:

```text
Check-in: 2026-06-01
Check-out: 2026-08-31
Rent per month: AED 8,000
Billing months: 3
```

Fees:

```text
DTCM fee: AED 900
Agency fee: AED 4,000
Security deposit: AED 3,000
Cleaning fee: AED 500
Misc fee: AED 250
```

Generated payment schedule:

| Payment No. | Due Date | Description | Amount |
|---:|---|---|---:|
| 1 | 2026-06-01 | First month rent + DTCM + agency fee + deposit + cleaning + misc | AED 16,650 |
| 2 | 2026-07-01 | Monthly rent only | AED 8,000 |
| 3 | 2026-08-01 | Monthly rent only | AED 8,000 |

Grand total:

```text
AED 16,650 + AED 8,000 + AED 8,000 = AED 32,650
```

---

## 6.2 Payment Schedule Object

Example payment schedule JSON:

```json
{
  "booking_id": "BK-1001",
  "payment_schedule": [
    {
      "payment_no": 1,
      "due_date": "2026-06-01",
      "description": "First month rent + DTCM fee + agency fee + security deposit + cleaning fee + misc fee",
      "amount": 16650,
      "status": "Pending"
    },
    {
      "payment_no": 2,
      "due_date": "2026-07-01",
      "description": "Monthly rent only",
      "amount": 8000,
      "status": "Pending"
    },
    {
      "payment_no": 3,
      "due_date": "2026-08-01",
      "description": "Monthly rent only",
      "amount": 8000,
      "status": "Pending"
    }
  ]
}
```

---

# 7. Payment Statuses

The booking should have payment status.

| Payment Status | Meaning |
|---|---|
| Pending | No payment received |
| Partially Paid | Some amount received |
| Paid | Full amount received |
| Overdue | Payment due date passed |
| Refunded | Amount refunded |
| Deposit Held | Security deposit is held due to damages |
| Deposit Refunded | Security deposit returned |

---

# 8. Payment Collection Flow

## Step 1: Agent Creates Booking

Agent enters:

```text
Guest stay dates
Rent per month
DTCM fee
Agency fee
Security deposit
Cleaning fee
Misc fee
Comments/terms
```

## Step 2: System Calculates Stay

System calculates:

```text
Number of stay days
Billing months
Total rent
First month total
Next month rent amount
Grand total
```

## Step 3: Agent Reviews Amounts

The agent can review:

```text
First month payable
Monthly recurring payable
Grand total
Payment schedule
```

## Step 4: Booking is Confirmed

The system should allow booking confirmation based on business rules.

Example:

```pseudo
IF first_month_payment_received:
    booking_status = "Confirmed"
    payment_status = "Partially Paid" OR "Paid"
    apartment_status = "Reserved"
ELSE:
    booking_status = "Pending Payment"
    apartment_status = "Temporarily Held"
```

## Step 5: Payment Receipts Are Recorded

For each payment, the system should store:

```json
{
  "payment_id": "PAY-1001",
  "booking_id": "BK-1001",
  "payment_schedule_id": "PS-001",
  "amount_received": 16650,
  "payment_method": "Cash / Bank Transfer / Card / Cheque / Online",
  "received_by": "Agent/Admin",
  "received_at": "timestamp",
  "receipt_number": "RCPT-0001",
  "notes": "First month payment received."
}
```

---

# 9. Special Terms and Conditions

The booking form must include a comment box for specific terms and conditions.

Field name:

```text
special_terms_and_conditions
```

Purpose:

The agent can enter any custom agreement, exception, or condition.

Examples:

```text
Guest will pay DEWA separately.
Security deposit is refundable after checkout inspection.
Guest requested early check-in at 12 PM.
Cleaning fee is waived by manager approval.
Agency fee will be collected by bank transfer.
Tenant will pay second month rent before 1st July.
```

Recommended structure:

```json
{
  "special_terms_and_conditions": "Security deposit refundable after inspection. Internet charges are excluded from rent."
}
```

The system should display this comment in:

1. Booking details page
2. Invoice/payment page
3. Guest agreement, if generated
4. Admin notes
5. Checkout/deposit review page

---

# 10. Booking Statuses

| Booking Status | Meaning |
|---|---|
| Draft | Booking entered but not confirmed |
| Pending Payment | Waiting for payment |
| Pending Confirmation | Waiting for approval, payment, or details |
| Confirmed | Booking is valid and apartment is reserved |
| Pre-Check-In | Check-in date is near |
| Pre-Check-In Ready | Payment/documents/access/apartment are ready |
| Checked-In | Guest has arrived or access has started |
| In-House | Guest is currently staying |
| Due for Checkout | Today is checkout date |
| Checked-Out | Guest has left |
| Completed | Booking and post-checkout process are closed |
| Cancelled | Booking was cancelled |
| No-Show | Guest did not arrive |
| Extended | Booking dates were extended |

---

# 11. Apartment Statuses

| Apartment Status | Meaning |
|---|---|
| Available | Can be booked |
| Temporarily Held | Held for pending payment/confirmation |
| Reserved | Future booking exists |
| Occupied | Guest is currently inside |
| Checkout Pending | Guest is expected to leave |
| Dirty / Cleaning Required | Guest left, cleaning not done |
| Under Cleaning | Cleaning is in progress |
| Inspection Pending | Cleaning done but not verified |
| Maintenance Required | Issue found; cannot be available |
| Under Maintenance | Technician is working |
| Maintenance Verification Pending | Repair completed but not verified |
| Ready | Clean, inspected, and maintenance clear |
| Blocked | Manually blocked |
| Out of Service | Long-term unavailable |

---

# 12. Pre-Check-In Flow

Before guest arrival, System should verify:

| Checklist Item | Required |
|---|---:|
| First month payment received | Yes |
| Guest details completed | Yes |
| Guest ID/passport submitted | Yes |
| Apartment assigned | Yes |
| Apartment cleaned | Yes |
| Maintenance clear | Yes |
| Access code/key prepared | Yes |
| Check-in instructions sent | Yes |

Pseudo logic:

```pseudo
IF today is near check_in_date:
    check payment_status
    check documents_status
    check apartment_status
    check cleaning_status
    check maintenance_status
    check access_status

IF all checks are complete:
    booking_status = "Pre-Check-In Ready"
ELSE:
    booking_status = "Pre-Check-In Pending"
    create alert for admin
```

The System should not allow check-in if the first required payment has not been received unless a manager override is provided.

---

# 13. Check-In Flow

Check-in can be triggered by:

1. Admin manually clicking Check In
2. Agent confirming guest arrival
3. Guest submitting check-in form
4. Smart lock/access activation
5. System auto check-in by date/time, if enabled

When guest checks in:

```pseudo
booking_status = "Checked-In"
apartment_status = "Occupied"
access_status = "Active"
current_booking_id = booking_id
```

Check-in should be blocked if:

```text
Payment is not received
Guest documents are missing
Apartment is under cleaning
Apartment is under maintenance
Apartment is blocked
Booking is cancelled
Apartment belongs to another active booking
```

Manager override can be allowed, but the system must require a reason.

---

# 14. During Stay Flow

During the guest stay:

```text
Booking Status = In-House
Apartment Status = Occupied
```

The system should allow:

1. Payment updates
2. Next rent payment reminders
3. Booking extension
4. Guest complaint creation
5. Maintenance request creation
6. Access extension
7. Housekeeping request
8. Early checkout

If guest reports a maintenance issue:

```pseudo
create maintenance_task
maintenance_status = "Maintenance Required"
apartment_status remains "Occupied"
```

If the issue is serious and the unit is unsafe:

```pseudo
apartment_status = "Emergency Maintenance"
notify operations team
arrange relocation if required
```

---

# 15. Monthly Payment Reminder Flow

The system should track upcoming rent payments.

Example:

```pseudo
FOR each payment in payment_schedule:
    IF payment.status = "Pending"
    AND due_date is within next 3 days:
        send reminder to agent/admin/guest

    IF payment.status = "Pending"
    AND today > due_date:
        payment.status = "Overdue"
        booking.payment_status = "Overdue"
```

The dashboard should show:

1. Payments due today
2. Payments due this week
3. Overdue payments
4. Partially paid bookings
5. Deposit pending refunds
6. Deposit held due to damages

---

# 16. Checkout Flow

Checkout happens when the guest leaves.

Checkout can be triggered by:

1. Admin manually clicking Check Out
2. Agent confirming guest left
3. Guest submitting checkout form
4. Smart lock access expiry
5. Cleaner confirming apartment is vacant
6. System auto-checkout after checkout time, if enabled

When checkout happens:

```pseudo
booking_status = "Checked-Out"
apartment_status = "Dirty / Cleaning Required"
cleaning_status = "Pending"
access_status = "Expired"
last_checkout_date = today
```

Important:

> Checkout must automatically create a cleaning task.

---

# 17. Post-Checkout Cleaning Flow

When booking becomes Checked-Out:

```pseudo
create cleaning_task
cleaning_task.status = "Pending"
apartment.cleaning_status = "Cleaning Required"
apartment.apartment_status = "Dirty / Cleaning Required"
```

If there is another check-in today or tomorrow:

```pseudo
cleaning_task.priority = "Urgent"
```

Cleaning task lifecycle:

```text
Pending → Assigned → In Progress → Completed → Inspection Pending
```

When cleaner starts:

```pseudo
cleaning_task.status = "In Progress"
apartment_status = "Under Cleaning"
```

When cleaner completes:

```pseudo
cleaning_task.status = "Completed"
cleaning_status = "Cleaned"
apartment_status = "Inspection Pending"
```

Cleaner should upload:

1. Before photos, if required
2. After photos
3. Damage photos
4. Missing item notes
5. Maintenance remarks

---

# 18. Inspection Flow

After cleaning, the apartment should be inspected.

Inspection results:

| Result | Action |
|---|---|
| Passed | Apartment can move to Ready |
| Failed Cleaning | Reopen cleaning task |
| Maintenance Found | Create maintenance task |
| Damage Found | Create damage report |
| Missing Items | Create replacement task |

Pseudo logic:

```pseudo
IF inspection_passed AND no maintenance_required:
    apartment_status = "Ready"
    cleaning_status = "Clean"
    maintenance_status = "Clear"

ELSE IF cleaning_failed:
    apartment_status = "Under Cleaning"
    reopen cleaning_task

ELSE IF maintenance_required:
    apartment_status = "Maintenance Required"
    create maintenance_task
```

---

# 19. Maintenance Flow After Checkout

If maintenance is found after checkout:

```pseudo
create maintenance_task
apartment_status = "Maintenance Required"
maintenance_status = "Pending"
```

Maintenance lifecycle:

```text
Pending → Assigned → In Progress → Completed → Verified → Closed
```

When technician starts:

```pseudo
maintenance_task.status = "In Progress"
apartment_status = "Under Maintenance"
```

When technician completes:

```pseudo
maintenance_task.status = "Completed"
maintenance_status = "Completed"
verification_status = "Pending"
apartment_status = "Maintenance Verification Pending"
```

After verification:

```pseudo
IF maintenance_verified:
    maintenance_status = "Clear"

    IF cleaning_status = "Clean":
        apartment_status = "Ready"
    ELSE:
        apartment_status = "Dirty / Cleaning Required"
```

---

# 20. Moving Apartment Back to Availability List

The apartment can become available only when all conditions are clear.

Required conditions:

```pseudo
booking_status is not "Checked-In" or "In-House"
AND apartment_status is "Ready"
AND cleaning_status is "Clean"
AND maintenance_status is "Clear"
AND inspection_status is "Passed"
AND no blocking task exists
AND no active issue exists
```

Final logic:

```pseudo
IF apartment_status = "Ready"
AND cleaning_status = "Clean"
AND maintenance_status = "Clear"
AND inspection_status = "Passed"
AND no active booking currently occupying unit:
    apartment_status = "Available"
    availability_status = "Available"
ELSE:
    apartment_status remains unavailable
```

---

# 21. Complete End-to-End Flow

```text
1. Agent creates booking.
2. Agent selects apartment and guest stay dates.
3. System calculates number of stay days.
4. System checks apartment availability.
5. System shows fee collection fields.
6. Agent enters rent per month.
7. Agent enters DTCM fee, agency fee, security deposit, cleaning fee, and misc fee.
8. Agent enters special terms/comments, if any.
9. System calculates total rent.
10. System calculates first month total.
11. System calculates next month rent amount.
12. System calculates grand total.
13. System generates payment schedule.
14. First month payment includes rent + all fees.
15. Next month payments include rent only unless extra monthly fees are added.
16. Booking is confirmed after payment or approval.
17. Apartment status becomes Reserved.
18. Before check-in, System verifies payment, documents, apartment readiness, and access.
19. Guest checks in.
20. Booking status becomes Checked-In / In-House.
21. Apartment status becomes Occupied.
22. System tracks monthly rent/payment reminders.
23. Guest checks out.
24. Booking status becomes Checked-Out.
25. Access expires.
26. Apartment status becomes Dirty / Cleaning Required.
27. Cleaning task is created.
28. Cleaner completes cleaning.
29. Apartment moves to Inspection Pending.
30. If inspection passes, apartment moves to Ready.
31. If maintenance is found, maintenance task is created.
32. Maintenance is completed and verified.
33. Apartment becomes Ready.
34. System checks for blockers and next bookings.
35. If all clear, apartment becomes Available.
36. Booking becomes Completed.
```

---

# 22. AI-Friendly Decision Rules

An AI model managing this System should always check:

```text
1. Is the booking new, active, checked out, or completed?
2. What is the apartment status?
3. What is the guest stay period?
4. How many days is the guest staying?
5. What monthly rent did the agent enter?
6. What one-time fees were entered?
7. What is the first month total?
8. What are the remaining monthly payments?
9. Has the required first payment been received?
10. Can the guest check in?
11. Has the guest checked out?
12. Is cleaning required?
13. Is cleaning completed?
14. Has inspection passed?
15. Is maintenance required?
16. Is maintenance completed and verified?
17. Can the apartment safely be marked available again?
```

---

# 23. AI-Friendly Fee Logic Summary

```pseudo
WHEN agent creates booking:
    require check_in_date
    require check_out_date
    require apartment_id
    require rent_per_month

    number_of_stay_days = check_out_date - check_in_date

    billing_months = agent_selected_billing_months
    IF agent_selected_billing_months is empty:
        billing_months = ceil(number_of_stay_days / 30)

    total_rent = rent_per_month * billing_months

    first_month_total =
        rent_per_month
        + dtcm_fee
        + agency_fee
        + security_deposit
        + cleaning_fee
        + misc_fee

    remaining_months = billing_months - 1

    next_month_total = rent_per_month

    grand_total_amount =
        first_month_total
        + (remaining_months * next_month_total)

    generate payment schedule
```

---

# 24. Example Complete Fee Calculation

## Input

```text
Check-in date: 2026-06-01
Check-out date: 2026-08-31
Billing months: 3
Rent per month: AED 8,000
DTCM fee: AED 900
Agency fee: AED 4,000
Security deposit: AED 3,000
Cleaning fee: AED 500
Misc fee: AED 250
```

## Calculation

```text
Total rent = AED 8,000 × 3 = AED 24,000

First month total =
AED 8,000
+ AED 900
+ AED 4,000
+ AED 3,000
+ AED 500
+ AED 250
= AED 16,650

Next month payment = AED 8,000

Grand total =
AED 16,650
+ AED 8,000
+ AED 8,000
= AED 32,650
```

---

# 25. Recommended Booking Form Fields

## Guest Details

```json
{
  "guest_name": "",
  "guest_phone": "",
  "guest_email": "",
  "guest_id_document": "",
  "nationality": "",
  "number_of_guests": 1
}
```

## Stay Details

```json
{
  "apartment_id": "",
  "check_in_date": "",
  "check_out_date": "",
  "number_of_stay_days": 0,
  "system_calculated_months": 0,
  "agent_selected_billing_months": 0
}
```

## Fee Details

```json
{
  "rent_per_month": 0,
  "dtcm_fee": 0,
  "agency_fee": 0,
  "security_deposit": 0,
  "cleaning_fee": 0,
  "misc_fee": 0,
  "first_month_total": 0,
  "next_month_total": 0,
  "grand_total_amount": 0
}
```

## Terms and Comments

```json
{
  "special_terms_and_conditions": "",
  "internal_admin_notes": "",
  "guest_visible_notes": ""
}
```

---

# 26. Recommended Validation Rules

The system should validate the booking before confirmation.

```pseudo
IF check_in_date is empty:
    block booking confirmation

IF check_out_date is empty:
    block booking confirmation

IF check_out_date <= check_in_date:
    block booking confirmation

IF apartment_id is empty:
    block booking confirmation

IF rent_per_month <= 0:
    block booking confirmation

IF apartment has overlapping confirmed booking:
    block booking confirmation

IF apartment_status IN ["Blocked", "Out of Service", "Under Maintenance"]:
    block booking confirmation

IF first_month_total <= 0:
    block booking confirmation
```

Optional validation:

```pseudo
IF security_deposit = 0:
    show warning

IF cleaning_fee = 0:
    show warning

IF dtcm_fee = 0:
    show warning

IF special_terms_and_conditions is empty:
    allow booking but keep field available
```

---

# 27. Recommended Dashboard Items

## Booking Dashboard

Show:

1. New bookings
2. Pending payment bookings
3. Confirmed bookings
4. Today’s check-ins
5. Today’s check-outs
6. In-house guests
7. Overdue payments
8. Missing documents
9. Cancelled bookings
10. No-show bookings

## Payment Dashboard

Show:

1. First month payments pending
2. Monthly rent due
3. Overdue rent
4. Security deposit collected
5. Security deposit refundable
6. Security deposit held
7. Agency fee collected
8. DTCM fee collected
9. Cleaning fee collected
10. Misc fee collected

## Apartment Dashboard

Show:

1. Available apartments
2. Reserved apartments
3. Occupied apartments
4. Dirty apartments
5. Under cleaning apartments
6. Inspection pending apartments
7. Maintenance required apartments
8. Ready apartments
9. Blocked apartments
10. Out of service apartments

---

# 28. Final Summary

The System must allow the agent to create a booking by selecting the apartment, entering guest stay dates, and entering all required fees.

The system must automatically calculate the number of stay days and help generate the billing structure.

The fee section must include:

```text
Rent per month
DTCM fee
Agency fee
Security deposit
Cleaning fee
Misc fee
Total amount
Special terms/comments
```

The first month payment must include:

```text
First month rent
+ DTCM fee
+ Agency fee
+ Security deposit
+ Cleaning fee
+ Misc fee
```

The next month payments should normally include:

```text
Monthly rent only
```

After checkout, the apartment must not return to availability immediately. It must go through cleaning, inspection, and maintenance clearance before becoming available again.

The final availability rule is:

```pseudo
Apartment can become Available only if:
    no active guest
    no active booking blocking it
    cleaning is completed
    inspection passed
    maintenance is clear
    apartment is not blocked or out of service
```
