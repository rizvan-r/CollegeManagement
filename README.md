# College Management Portal (CMP)

> **One Campus. One Platform. Complete Management.**  
> An enterprise-grade academic administration platform built with React 19, Vite, Stitch UI Design System, Node.js Express, and Neon Remote PostgreSQL.

---

## 🏛️ System Overview

The **College Management Portal (CMP)** is a centralized higher-education management platform engineered for institutional governance, faculty workload administration, and student academic success. It centralizes student admissions, faculty workload distribution, department administration, lecture roll call with automated On-Duty (OD) credit calculation, live session PIN student self check-in, course enrollment, targeted campus notices, and role-based real-time analytics.

### Architecture Highlights
- **Frontend:** React 19, Vite, Stitch UI Design System (Deep Slate `#0b1c30`, Sky `#0284c7`, Emerald `#059669`, Neutral Slate `#eff4ff`), React Router v7, Axios, Material Symbols Outlined.
- **Backend:** Node.js, Express.js REST API (`/api/v1`), JWT Authentication with cryptographically secure fallback, bcrypt password hashing, input sanitization, rate-limiting, and Helmet security headers.
- **Database:** Remote managed PostgreSQL on [Neon.tech](https://neon.tech) with SSL connection pooling (`pg`).
- **Zero BaaS Restriction:** Strictly no Firebase, no Supabase, and no local-only SQLite. Full relational schema integrity on remote PostgreSQL.
- **Persistence Guarantee:** 100% of data persists across browser reloads, frontend redeployments, and backend server restarts.

---

## 🚀 Key Features & Innovations

### 1. 🎓 Separate Role-Based Institutional Portals
Independent login gateways with role enforcement and tailored visual themes:
- **Student SIS Gateway:** [`/login/student`](http://localhost:5173/login/student) – Scholar transcript hub, course registration, attendance ledger, and live check-in.
- **Faculty & Instructor Portal:** [`/login/faculty`](http://localhost:5173/login/faculty) – Workload overview, class roll call, session PIN generation, and student advisement.
- **Admin & Registrar Hub:** [`/login/admin`](http://localhost:5173/login/admin) – Institutional governance, department control, faculty/student registration, and audit logs.

### 2. 🔢 Live Lecture Session PIN Check-In
- **Faculty PIN Generation:** Professors generate a dynamic 6-digit Session PIN (e.g., `485-568`) valid for 10 minutes, projected on the lecture hall display.
- **Instant Student Check-In:** Students enter the PIN on their **Student Dashboard** or **Attendance Log** to record their attendance.
- **Automated Verification:** The backend verifies student enrollment, session validity, and PIN expiration, recording attendance as `PRESENT` in Neon PostgreSQL with timestamped audit remarks.

### 3. 📝 Live Roll Call & Session Updates
- Faculty can take attendance period-by-period with bulk toggle actions (All Present, All Absent, On-Duty).
- **Session Submit & Update:** Automatically detects whether an attendance session already exists for the selected date and period, allowing faculty to submit new records or update previously submitted rosters.

### 4. 📚 Student Course Self-Enrollment
- Direct student enrollment at [`/enrollments`](http://localhost:5173/enrollments) with credit load limits and schedule conflict checks.
- Administrative and faculty oversight over student course registrations.

### 5. 🔮 "What-If" Attendance Forecaster Simulator
- Interactive simulator allowing students and advisors to forecast future attendance percentages.
- Calculates the exact number of consecutive classes a student must attend to reach or exceed the institutional **75%** compliance threshold.

### 6. ⚡ Campus AI Copilot & Command Palette
- **Global Command Palette (`Ctrl + K` / `Cmd + K`):** Quick jump navigation across departments, courses, student records, and settings.
- **Campus AI Copilot (`Ctrl + J` / `Cmd + J`):** Real-time academic assistant for institutional guidelines, course policies, and queries.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js 20+ (Node.js 26 recommended)
- npm 10+
- A [Neon.tech](https://neon.tech) PostgreSQL database instance

### 1. Repository Setup & Dependencies
```bash
# Clone the repository
git clone https://github.com/rizvan-r/CollegeManagement.git
cd CollegeManagement

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables
In the `server/` directory, create or edit `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:your_password@ep-your-neon-host.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secure_college_management_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

In the `client/` directory (optional for local development, defaults to port 5000):
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 3. Apply Database Migrations & Seed Data
Execute the migration and seed scripts to establish all relational tables and initial sample data:
```bash
# In server directory:
node database/migrate.js
node database/seed.js
```

### 4. Run Development Servers

**Start Express API Backend:**
```bash
# In server directory (runs on port 5000):
node server.js
# Health check available at: http://localhost:5000/api/v1/health
```

**Start Vite React Frontend:**
```bash
# In client directory (runs on port 5173):
npm run dev
# Portal accessible at: http://localhost:5173
```

---

## 🔑 Demo Login Accounts

Universal demo password: **`Password@123`**

| Role | Email | Password | Primary Portal Route | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **College Administrator** | `admin@college.edu` | `Password@123` | [`/login/admin`](http://localhost:5173/login/admin) | Institutional KPIs, user CRUD, department administration, audit trails. |
| **Department Staff / HOD**| `hod.cse@college.edu` | `Password@123` | [`/login/faculty`](http://localhost:5173/login/faculty) | Departmental faculty/student roster, course allocations, circulars. |
| **Faculty Member** | `faculty.alan@college.edu` | `Password@123` | [`/login/faculty`](http://localhost:5173/login/faculty) | Lecture roll call, session PIN generation, course grading rosters. |
| **Student** | `student.alex@college.edu` | `Password@123` | [`/login/student`](http://localhost:5173/login/student) | Transcript overview, attendance PIN check-in, course enrollment. |

---

## 📊 Database Schema (12 Relational Tables)

1. `users` – Authentication identities, bcrypt hashed passwords, and roles (`ADMIN`, `DEPARTMENT_STAFF`, `FACULTY`, `STUDENT`).
2. `departments` – Academic divisions (CSE, ECE, MECH, MBA) with assigned HOD reference.
3. `academic_years` – Annual academic sessions (e.g., `2025-2026`).
4. `faculty` – Faculty profiles, employee numbers, and designations.
5. `students` – Student admissions, registration numbers, and current semester.
6. `courses` – Academic curriculum catalog with credit weighting (1-10) and semester levels.
7. `course_assignments` – Faculty instructional assignments per academic year and section.
8. `enrollments` – Student registration in specific course assignments.
9. `attendance_sessions` – Conducted lectures with date, period (1-8), topic, `session_pin`, and `pin_expires_at`.
10. `attendance_records` – Per-student session status (`PRESENT`, `ABSENT`, `ON_DUTY`, `LATE`) and audit remarks.
11. `notices` – Institutional and departmental circulars with audience targeting and expiration dates.
12. `audit_logs` – Immutable audit trail recording administrative modifications with JSON diffs.

---

## 📐 Attendance & On-Duty (OD) Formula

In accordance with institutional accreditation standards, approved On-Duty sessions count as **Present**:

$$\text{Attendance \%} = \left( \frac{\text{Sessions Marked Present} + \text{Sessions Marked On-Duty}}{\text{Total Sessions Conducted}} \right) \times 100$$

- **Compliant (≥ 75%):** Eligible for end-semester examinations without penalty.
- **Deficient (< 75%):** Triggers visual warning banners and requires departmental condonation.

---

## ☁️ Production Deployment Guide

### Backend on Render.com
1. Create a new **Web Service** on [Render.com](https://dashboard.render.com).
2. Connect this repository and set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/api/v1/health`
3. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *Your Neon PostgreSQL connection string*
   - `JWT_SECRET`: *A secure 32+ character random string (or use the auto-generated runtime fallback)*
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: *Your production frontend URL (or `*`)*

### Frontend on Vercel
1. Import this repository on [Vercel](https://vercel.com).
2. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com/api/v1`

---

## 🧪 Automated Testing

### Playwright End-to-End Test Suite
Runs multi-context browser tests verifying faculty PIN generation, student login, live check-in, and database persistence:
```bash
node scripts/test_student_pin_checkin_playwright.mjs
```

### Backend Integration Test Suites
```bash
# Test complete CRUD and Neon DB sync
node server/test_all_crud_and_sync.mjs

# Test live session PIN generation and student check-in
node server/test_session_pin_checkin.mjs

# Test attendance submission and update
node server/test_attendance_submit_update.mjs
```

---

## 📄 Documentation Reference

For detailed architectural specifications, ER diagrams, security audits, and API documentation:
- [Technical Master Plan](file:///i:/Richu/Projects/CollegeManagement/docs/TECHNICAL_MASTER_PLAN.md)
- [Deployment Guide](file:///i:/Richu/Projects/CollegeManagement/docs/DEPLOYMENT_GUIDE.md)
