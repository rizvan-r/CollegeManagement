# College Management Portal (CMP)

> **One Campus. One Platform. Complete Management.**  
> An enterprise-grade academic administration platform built with React, Vite, Tailwind CSS, Node.js Express, and Neon Remote PostgreSQL.

---

## 🏛️ System Overview

The **College Management Portal (CMP)** is a centralized platform designed for higher education institutions. It centralizes student admissions, faculty workloads, department administration, daily lecture attendance tracking with on-duty credit logic, targeted campus circulars, and role-based real-time analytics.

### Architecture Highlights
- **Frontend:** React 19, Vite, Tailwind CSS (Navy `#163A63` & Teal `#0F9D94` design tokens), React Router v7, Axios, Lucide Icons.
- **Backend:** Node.js, Express.js REST API (`/api/v1`), JWT Authentication, bcrypt password hashing, Zod validation.
- **Database:** Remote managed PostgreSQL on [Neon.tech](https://neon.tech) with SSL connection pooling via `pg`.
- **Zero BaaS Restriction:** Strictly no Firebase, no Supabase, and no local-only SQLite. Genuine remote PostgreSQL integration.
- **Persistence Guarantee:** 100% of records persist across browser refreshes, frontend redeployments, and backend server restarts.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+ (Node.js 26 recommended)
- npm 10+
- A free [Neon.tech](https://neon.tech) PostgreSQL database instance

### 1. Repository Setup & Dependencies
Install dependencies for both the Express backend and React frontend:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Remote PostgreSQL Database
1. Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech).
2. Copy the connection string provided by Neon (e.g., `postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require`).
3. Open `server/.env` and update the `DATABASE_URL`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://your_neon_user:your_neon_password@ep-your-host.neon.tech/neondb?sslmode=require
JWT_SECRET=super_secure_college_management_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Apply Database Migrations & Seed Data
Execute the migration script to create all 12 normalized relational tables, constraints, and triggers in your remote Neon database:
```bash
# In server directory:
node database/migrate.js
```

Populate demo data (admin, departments, faculty, students, courses, enrollments, notices):
```bash
# In server directory:
node database/seed.js
```

### 4. Run Development Servers

**Start Express API Backend:**
```bash
# In server directory (runs on port 5000):
npm run dev
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

All accounts share the universal demo password: **`Password@123`** (or `Admin@123` for administrator).

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **College Administrator** | `admin@college.edu` | `Password@123` | Institutional dashboard, department management, full user CRUD, notice broadcast, audit logs. |
| **Department Staff / HOD**| `hod.cse@college.edu` | `Password@123` | Department students/faculty roster, course allocations, department notices. |
| **Faculty Member** | `faculty.alan@college.edu` | `Password@123` | Teaching schedule, daily lecture attendance marking (Present/Absent/On-Duty), student rosters. |
| **Student** | `student.alex@college.edu` | `Password@123` | Personal academic profile, subject-wise attendance gauge, exam eligibility, campus notices. |

---

## 📊 Database Schema (12 Relational Tables)

1. `users` – Authentication identities, bcrypt hashed credentials, and role assignments (`ADMIN`, `DEPARTMENT_STAFF`, `FACULTY`, `STUDENT`).
2. `departments` – Academic divisions (e.g. CSE, ECE, MECH, MBA) with HOD foreign key.
3. `academic_years` – Annual academic sessions (e.g. `2025-2026`).
4. `faculty` – Faculty profiles, employee IDs, and academic designations.
5. `students` – Student admission records, unique admission numbers, and current semester.
6. `courses` – Curriculum course catalog with credit allocations (1-10) and semester levels.
7. `course_assignments` – Faculty allocation to courses per academic year and section.
8. `enrollments` – Student registration in specific course assignments.
9. `attendance_sessions` – Conducted lecture/lab hours with date, period (1-8), and topic.
10. `attendance_records` – Attendance status per student (`PRESENT`, `ABSENT`, `ON_DUTY`, `LATE`).
11. `notices` – Institutional and departmental announcements with audience filtering and expiry dates.
12. `audit_logs` – Immutable audit trail recording administrative state changes with JSON diffs.

---

## 📐 Attendance On-Duty (OD) Formula

In accordance with institutional standards, approved On-Duty sessions count as **Present** towards attendance:

$$\text{Attendance \%} = \left( \frac{\text{Sessions Marked Present} + \text{Sessions Marked On-Duty}}{\text{Total Sessions Conducted}} \right) \times 100$$

A visual warning is automatically triggered if a student's cumulative attendance drops below the mandatory **75%** threshold.

---

## 📄 Documentation Reference

For the comprehensive 20-deliverable system specification, Entity Relationship Diagram, and complete REST API definitions, inspect:
- [`docs/TECHNICAL_MASTER_PLAN.md`](file:///i:/Richu/Projects/CollegeManagement/docs/TECHNICAL_MASTER_PLAN.md)
