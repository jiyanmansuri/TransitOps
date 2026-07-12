# TransitOps — Smart Transport Operations Platform

TransitOps is a centralized, full-stack logistics management platform built for modern fleet operators. It enables real-time orchestration of vehicles, drivers, trips, maintenance, and analytics, protected by strict role-based access control (RBAC).

---

## 🚀 Key Features

1. **Operations Dashboard:** Live KPI tracking (utilization, active trips, shop status) and a stacked status breakdown bar.
2. **Vehicle Registry:** Complete vehicle CRUD operations enforcing unique registration numbers and tracking statuses.
3. **Drivers & Safety Profiles:** Expiry notifications for licenses and safety score metrics. Preventative assignment rules block suspended or expired drivers.
4. **Trip Dispatcher (Centerpiece):** Multi-step dispatch flow (Draft → Dispatched → Completed / Cancelled) with automatic payload capacity validation.
5. **Servicing & Maintenance:** Atomic status transitions. Scheduling a service moves a vehicle to "In Shop" automatically, and closing it returns it to "Available".
6. **Fuel & Expenses:** Automated log tracking calculating overall operational costs dynamically.
7. **Analytics & ROI Reports:** High-performance KPIs and charts including Monthly Revenue tracking and Vehicle ROI calculated as:
   $$\text{ROI} = \frac{\text{Revenue} - (\text{Maintenance} + \text{Fuel})}{\text{Acquisition Cost}} \times 100\%$$
8. **Role-Based Access Control (RBAC):** Real route guarding protecting routes and API endpoints for four distinct roles.

---

## 🛠 Tech Stack

*   **Frontend:** React (v18) + TypeScript + Tailwind CSS + Recharts + React Query (v5) + React Router (v6)
*   **Backend:** Node.js + Express + TypeScript
*   **Database:** SQLite + Prisma ORM
*   **Authentication:** JWT-based session security with role-claims and 5-attempt brute-force lockouts.

---

## ⚙️ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### 1. Clone & Install Dependencies
Clone the repository, go into the project folder, and run:
```bash
# Install root dependencies
npm install --legacy-peer-deps

# Install server and client dependencies
npm run setup
```

### 2. Database Migration & Seeding
Initialize the SQLite database schema and load seed data:
```bash
# Generate the Prisma client
npm run prisma:generate

# Push schema to SQLite
npm run prisma:push

# Load seed data (creates demo accounts, vehicles, drivers, and trips)
npm run seed
```

### 3. Run Locally
Start both the Express backend server (port 3001) and Vite frontend development client (port 5173) concurrently:
```bash
npm run dev
```

*   **Web Console:** [http://localhost:5173](http://localhost:5173)
*   **API Gateway:** [http://localhost:3001](http://localhost:3001)

---

## 🔑 Demo Access Profiles

Log in using any of the following email addresses (all accounts use the password **`demo1234`**):

| Role | Email | Module Permissions |
| :--- | :--- | :--- |
| **Fleet Manager** | `fleet@demo.com` | Fleet (Edit), Drivers (Edit), Maintenance (Edit), Analytics (Edit), Settings (Edit) |
| **Dispatcher** | `dispatch@demo.com` | Fleet (View), Trips (Edit) |
| **Safety Officer** | `safety@demo.com` | Drivers (Edit), Trips (View) |
| **Financial Analyst** | `finance@demo.com` | Fleet (View), Fuel & Expenses (Edit), Analytics (Edit) |