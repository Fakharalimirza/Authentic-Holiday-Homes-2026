# Master Implementation Plan: Authentic Holiday Homes (AHH)
*A high-precision, step-by-step architectural blueprint to expand the platform into a multi-role, full-service property management and monthly rental ecosystem.*

---

## 1. Executive Summary & Core Business Logic

**Authentic Holiday Homes** operates as a premium property operator:
1. **Sourcing**: Acquires luxury real estate units from **Landlords**.
2. **Monetization**: Sub-leases these assets to **Guests** on a monthly basis, offering premium hospitality, concierge, and dedicated on-site services.
3. **Execution**: Employs **Agents** to manage user intake/bookings, **Cleaning/Maintenance Teams** to handle physical turnovers, **Admins** to manage operational configurations, and **Super Admins** for ultimate systems governance.

To support this model, we will transition the platform from a single host-admin dashboard into a **Role-Based Access Control (RBAC) Portal Network** with automated invoicing and service workflows.

---

## 2. Core User Roles & Permission Matrix

| Feature / Action | Guest | Landlord | Agent | Admin | Super Admin | Cleaning/Maint. |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse public listings / profile** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **View active unit stay details** | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **View monthly rent invoice queue**| ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Trigger early checkout / extend** | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Schedule rent collection pickup**| ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Raise Support / Maintenance Ticket** | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **View owned assets status / payouts**| ✗ | ✓ | ✗ | ✓ | ✓ | ✗ |
| **Create Guest & Manual Bookings**  | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| **Update Global/System Configs**   | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Perform Database/Record Deletions**| ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| **View & claim maintenance job queue** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Resolve tickets & reset unit availability** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |

---

## 3. Database Schema Extensions (Firestore)

To enable these distinct workflows, we will expand our Firestore schema with the following model configurations:

### `users` (Collection)
Defines identity, roles, and profile structures.
```json
{
  "uid": "USER_ID_123",
  "email": "user@example.com",
  "displayName": "Ahmed Al-Mansoori",
  "role": "landlord", // "guest" | "landlord" | "agent" | "admin" | "super_admin" | "maintenance"
  "phoneNumber": "+971501234567",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `properties` (Collection Update)
Tracks minimum stay settings and landlord ownership bindings.
```json
{
  "id": "PROPERTY_ID_55",
  "title": "Marina Heights - Suite 1404",
  "landlordId": "USER_ID_123", // Linked Landlord Profile
  "status": "occupied", // "available" | "occupied" | "under_maintenance"
  "minimumNights": 30, // Default minimum booking length (Monthly focus)
  "...": "existing_fields"
}
```

### `invoices` (Collection)
Manages dynamic monthly recurring payment cycles.
```json
{
  "id": "INV_2026_099",
  "bookingId": "BOOKING_ID_88",
  "guestId": "USER_ID_789",
  "propertyId": "PROPERTY_ID_55",
  "issueDate": "timestamp",
  "dueDate": "timestamp",
  "amount": 15000,
  "currency": "AED",
  "status": "pending", // "pending" | "paid" | "overdue" | "partially_paid"
  "payments": [
    {
      "amount": 5000,
      "date": "timestamp",
      "method": "Cash Collection"
    }
  ]
}
```

### `tickets` (Collection)
Supports unified maintenance, support request, and unit collection logging.
```json
{
  "id": "TICKET_ID_777",
  "propertyId": "PROPERTY_ID_55",
  "raisedBy": "USER_ID_789", // Guest or Landlord ID
  "type": "maintenance", // "maintenance" | "rent_collection" | "general_query"
  "subject": "Water filter replacement requested",
  "description": "The kitchen RO system filter is showing red status indicators.",
  "status": "open", // "open" | "in_progress" | "resolved"
  "assignedTo": "USER_ID_CLEANER_4", // Maintenance team user
  "scheduledTime": "timestamp", // For rent collection pickups or cleaning tasks
  "createdAt": "timestamp",
  "resolvedAt": "timestamp"
}
```

---

## 4. Phase-by-Phase Technical Implementation Roadmap

We will implement this roadmap sequentially, keeping the code highly modular, lint-certified, and styled with our elegant brand aesthetic.

### Phase 1: Authentication & User Role Routing Gateway
* **Goal**: Establish the Core Identity and RBAC distribution layer.
* **Steps**:
  1. Add a **Role selection onboarding wrapper** inside the authentication lifecycle.
  2. Implement an `/admin/users` management table enabling Super Admins to manually elevate user roles to `landlord`, `agent`, `admin`, `super_admin`, or `maintenance`.
  3. Create responsive dashboard routing layouts that adapt the UI layout immediately based on the authenticated user's role.

### Phase 2: Minimum Nights Validation & Enforcement
* **Goal**: Ensure that agents and guests cannot perform checkouts or bookings below owner-mandated constraints.
* **Steps**:
  1. Add a `minimumNights` configuration field into the admin **Add/Edit Property Wizard**.
  2. Implement backend validation checks in checkout systems and manually entered booking intakes to enforce the configured number of nights.
  3. Customize the date-picker UI to prevent select intervals shorter than the specified threshold.

### Phase 3: Landlord Dashboard Portal
* **Goal**: Enable landlords to monitor physical properties, view cash earnings, and maintain communication.
* **Steps**:
  1. Build a beautifully responsive grid view showing only properties matching `landlordId === currentUser.uid`.
  2. Display clear card status flags: `Available` (Green), `Rented` (Blue), and `Under Maintenance` (Orange).
  3. Present a robust dynamic earnings widget calculating historically completed bookings.
  4. Integrate a "Raise Support/Query Ticket" slide-out context panel directly from their specific property tiles.

### Phase 4: Guest Portal Desk
* **Goal**: Maximize customer satisfaction with convenient digital self-service.
* **Steps**:
  1. Create a dashboard displaying their ongoing active stay, property guidelines, and remaining days counts.
  2. Provide interactive controls for **Request Stay Extension** and **Early Check-out requests**.
  3. Implement a dynamic invoice statement grid showing their recurring monthly bills with receipts.
  4. Launch a "Schedule Rent Collection Profile" tool, allowing guests to choose a date/time for an on-site agent to pick up monthly cash or physical cheques.
  5. Provide a simple interface to raise maintenance requests with description attachments.

### Phase 5: The Agent Dashboard Desk
* **Goal**: Standardize and limit agent permissions to operational tasks.
* **Steps**:
  1. Build a clean, streamlined manual intake tool that allows agents to register a customer account profile and create a custom booking.
  2. Hide visual metrics like revenue totals, master settings configuration tabs, and layout controls from agents.
  3. Restrict agents from performing deletions on properties, bookings, or settings.

### Phase 6: Automatic Monthly Invoice Billing Engine
* **Goal**: Auto-generate recurring charges for multi-month tenants.
* **Steps**:
  1. Create a background check during server startup/cron cycles (or simulated directly on page dashboard loads for server efficiency) inspecting active stays.
  2. For a booking spanning multiple months, generate a new `invoice` document exactly 5 days before the start of the next 30-day block.
  3. Update Guest dashboards with a visual alert of the upcoming invoice due date.

### Phase 7: Automated Turnovers & Maintenance Work Desk
* **Goal**: Automate transitions between physical occupancy and housekeeping tasks.
* **Steps**:
  1. Once a checkout is marked complete (either by guest checkout click or admin check-out transition), automatically trigger an active status transition of the unit to `Under Maintenance`.
  2. Dispatch a notification/cleanup job profile ticket into the **Cleaning & Operational Team** queue.
  3. Build a specific dashboard view for role type `maintenance` listing open cleaning/prep tasks.
  4. Allow cleaning workers to click "Mark Cleared & Ready". On completion, flip the property status back to `Available` (Green) automatically.

### Phase 8: Notification Integrations (System & Mock Logs)
* **Goal**: Keep all stakeholders informed via unified message banners and email configurations.
* **Steps**:
  1. Build an inner-shell notification tab panel inside all dashboard portals.
  2. Trigger auto-delivery of notifications:
     * *To Landlords*: "Your unit Suite 1404 is now successfully rented!"
     * *To Guests*: "Invoice #102 is now available."
     * *To Cleaning Staff*: "Unit Suite 1404 has checked out and requires full service."
  3. Ensure a clean history of sent messages can be audited in settings.

---

## 5. UI/UX Design Directives

To match the existing luxury design of Authentic Holiday Homes:
* **Minimalist Aesthetics**: Use off-white gradients, dark backgrounds with high-contrast slate colors, and precise spacing gaps.
* **Status Accents**: Bold typography indicators (e.g. `AVAILABLE` in emerald green, `RENTED` in dark midnight indigo, `MAINTENANCE` in deep amber orange).
* **Grid Layouts**: Ensure information density feels premium, uncluttered, and readable, making extensive use of negative space.
* **Icons**: Standardize icons exclusively through `lucide-react` for responsive interactions (e.g., `Coins`, `Building`, `TrendingUp`, `Wrench`, `ShieldCheck`).

---

## 6. Development Workflow Strategy

We will progress sequentially:
1. Initialize Phase 1 to set up user identities and login options.
2. Develop the portal views (Landlord portal, then Guest desk, and finally Cleaning/Maintenance views).
3. Connect the automated backend state transitions (Auto invoice cycles, Checkout -> Maintenance).
4. Integrate communication triggers.

**Let's discuss this step-by-step roadmap. Respond with your feedback, suggestions, or confirmation to initiate Phase 1!**
