<div align="center">

<img width="247" height="87" alt="TransitOps Logo" src="client/src/components/Logo.tsx" />

# TransitOps

**Centralized Platform for Seamless Logistics and Fleet Operations**

*Real-time Fleet Tracking, Compliance, and Expense Management.*

---

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

</div>

---

## What is TransitOps?

TransitOps is a comprehensive **Fleet Management & Intelligent Logistics** platform designed to streamline dispatching, safety compliance, driver wellness monitoring, and operational cost auditing.

> By bringing Fleet Managers, Dispatchers, Safety Officers, and Financial Analysts into a single unified control gateway, TransitOps eliminates logistical blind spots, tracks fuel efficiency, and enforces safety compliance in real time.

---

## Table of Contents

- [Core Objectives](#-core-objectives)
- [Tech Stack](#-tech-stack)
- [Roles & Permissions](#-roles--permissions)
- [Core Modules](#-core-modules)
- [System Features](#-system-features)
- [Folder Structure](#-folder-structure)
- [Setup Guide](#-setup-guide)
- [Demo Credentials](#-demo-credentials)
- [Future Scope](#-future-scope)

---

##  Core Objectives

| # | Objective |
|---|-----------|
| 01 | Centralize fleet diagnostics, driver logs, and trip schedules under one dashboard |
| 02 | Monitor driver safety scores and enforce compliance regulations (license, medical, and fatigue hours) |
| 03 | Automate dispatch scheduling with validation gates to prevent assigning ineligible vehicles or drivers |
| 04 | Track and audit maintenance cycles, fuel consumption rates, and trip costs |
| 05 | Provide robust data exports (CSV/PDF) and visual performance charts for business audits |

---

##  Tech Stack

<details>
<summary><strong>Frontend Client</strong></summary>

| Package | Purpose |
|---------|---------|
| `React` + `Vite` | Rapid UI rendering, hot reloading, and bundle minification |
| `Tailwind CSS v3` | Utility-first styling with high-contrast custom dark/light theme accents |
| `@tanstack/react-query` | Declarative, cached server state synchronization and mutations |
| `recharts` | Visual telemetry graphs, ROI charts, and operational analytics |
| `lucide-react` | Scalable icon system |
| `react-router-dom` | Declarative, role-based route routing |

</details>

<details>
<summary><strong>Backend Server</strong></summary>

| Package | Purpose |
|---------|---------|
| `Express.js` | Modular REST API router for dispatch, vehicles, drivers, and financials |
| `ts-node-dev` | Live TypeScript compiler and automatic reload server |
| `Prisma ORM` | Safe database schemas, seeding scripts, and typed client relations |
| `SQLite` | Lightweight, relational database storage for quick migrations |
| `jsonwebtoken` | Token-based stateless authentication |
| `bcryptjs` | Password hashing for role identities |

</details>

---

##  Roles & Permissions

```
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ Role                │ Capabilities                                           │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Fleet Manager       │ Full Access · Manage vehicles, drivers, rules, configs │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Dispatcher          │ Plan trips · Assign eligible drivers & trucks          │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Safety Officer      │ Monitor safety scores · Expired licenses · Reminders  │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Financial Analyst   │ Cost auditing · Fuel logs · Analytics & ROI reports    │
└─────────────────────┴────────────────────────────────────────────────────────┘
```

---

##  Core Modules

<details>
<summary><strong>Dashboard Overview</strong></summary>

- Role-based visual KPI summaries (total active trips, pending maintenance, system alerts)
- Interactive graphs depicting monthly operational throughput
- Real-time notification banners for SLA breaches or vehicle downtime

</details>

<details>
<summary><strong>Fleet Registry</strong></summary>

- Vehicle logs recording type, odometer, max load capacity, acquisition costs, and active status
- Fleet-wide telemetry and active status indicators (`Available`, `OnTrip`, `InShop`, `Retired`)

</details>

<details>
<summary><strong>Driver & Safety Compliance</strong></summary>

- Full driver roster including categories (HMV, HGV, LMV), contact numbers, and safety scores
- Visual indicators flagging critical incidents (e.g. Speeding, Hard Braking)
- Automation rules checking license and medical certification expiry dates
- Fatigue warning indicators triggering when weekly driving hours exceed the safety limit (40 hours)

</details>

<details>
<summary><strong>Intelligent Dispatch</strong></summary>

- Standardized trip cards showing source, destination, dispatcher, cargo weight, and distances
- Validation gates checking driver eligibility (auto-locks expired licenses and suspended drivers)
- Automated vehicle eligibility checks ensuring assigned loads do not exceed maximum cargo capacity

</details>

<details>
<summary><strong>Fuel & Expenses Auditor</strong></summary>

- Record of logs tracking fuel fills, liters, costs, and linked trip costs
- Automated calculations tracking operational expense deltas and efficiency deviations

</details>

<details>
<summary><strong>Analytics & Reports</strong></summary>

- PDF/CSV export functionality built into reports modules
- Performance-to-cost ROI calculations per vehicle model

</details>

---

##  Folder Structure

```
├── client/
│   ├── src/
│   │   ├── api/                    # REST client configurations
│   │   ├── components/             # Reusable UI cards, modally-loaded views, and custom brand logos
│   │   ├── context/                # Context-aware user configurations
│   │   ├── hooks/                  # Custom React hooks (Auth, RBAC, etc.)
│   │   ├── pages/                  # Route screens (Dashboard, Fleet, Drivers, Trips, Analytics, Settings)
│   │   ├── App.tsx                 # Base router and query client initialization
│   │   └── index.css               # Global theme tokens, typography, and styling classes
│   ├── tailwind.config.js          # Extended color mappings and design system tokens
│   └── vite.config.ts              # Vite asset builder configurations
│
└── server/
    ├── src/
    │   ├── routes/                 # Express REST endpoint routers (auth, fleet, drivers, trips, reports)
    │   ├── middleware/             # Route validators and role-based permissions gates
    │   └── index.ts                # HTTP Server entry point
    ├── prisma/
    │   ├── schema.prisma           # Prisma relational database modeling
    │   └── seed.ts                 # Database seeding configurations with demo data
    └── package.json                # Dependencies and dev start scripts
```

---

##  Setup Guide

### 1 · Clone the repository

```bash
git clone https://github.com/jiyanmansuri/TransitOps.git
cd TransitOps
```

### 2 · Install root and workspace dependencies

Run the setup from the root folder:

```bash
npm install
```

### 3 · Setup database and migrations

Navigate to the server directory and run migrations:

```bash
cd server
npx prisma db push
```

### 4 · Seed with demo datasets

Seed the SQLite database with realistic mock data:

```bash
npm run seed
```

### 5 · Launch the development server

From the root directory, launch the concurrently run script:

```bash
npm run dev
```

> The application client runs locally at `http://localhost:5173` (or subsequent fallback port) and connects to the backend API server running at `http://localhost:3001`.

---

##  Demo Credentials

All seeded accounts share the password: `demo1234`.

| Role | Username |
|------|----------|
| Fleet Manager | `fleet@demo.com` |
| Dispatcher | `dispatch@demo.com` |
| Safety Officer | `safety@demo.com` |
| Financial Analyst | `finance@demo.com` |

---

## 🔭 Future Scope

<details>
<summary><strong>1 · Real-Time GPS Tracking Integration</strong></summary>

Integration with live vehicle GPS tracking telemetry APIs (such as Google Maps or OpenStreetMap) to plot live trucks directly on the dispatch dashboard.

</details>

<details>
<summary><strong>2 · Automated Invoice & Toll Reconciliation</strong></summary>

Connecting API endpoints directly with national FASTag / toll payment systems to auto-reconcile expense records with active trips.

</details>

<details>
<summary><strong>3 · Preventative Maintenance Machine Learning</strong></summary>

Training predictive models based on fuel efficiency variations and mileage intervals to auto-create maintenance schedules before breakdowns occur.

</details>

---

<div align="center">

```
TransitOps — Centralized Logistics & Fleet Operations Gateway
```

*Built with Node.js · React · Prisma · SQLite*

</div>