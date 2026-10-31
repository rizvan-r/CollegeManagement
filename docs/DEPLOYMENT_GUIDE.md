# College Management Portal (CMP) – Deployment Runbook

This guide outlines the production deployment procedure for the **College Management Portal (CMP)** in accordance with the mandatory stack:
- **Database:** Neon Remote PostgreSQL (Serverless)
- **Backend API:** Render (Web Service)
- **Frontend SPA:** Vercel (Edge Network)
- **Version Control:** GitHub (`https://github.com/rizvan-r/CollegeManagement.git`)

---

## Part 1: Remote Database Deployment (Neon.tech)

1. **Create Free Database Instance:**
   - Navigate to [Neon.tech](https://neon.tech) and log in.
   - Click **Create Project** -> Name it `college-management`.
   - Select Postgres version **15** or **16** and choose your preferred cloud region (e.g. `US East` or `Frankfurt`).
2. **Obtain Connection String:**
   - In your Neon project dashboard, locate the **Connection Details** box.
   - Select **Pooled connection** or standard direct connection with `sslmode=require`.
   - Example connection string:
     ```
     postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
     ```
3. **Run Schema Migration & Data Seeding:**
   - On your local terminal, update `server/.env` with your real connection string:
     ```env
     DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
     ```
   - Execute the schema migration and initial seed scripts:
     ```bash
     # From root or server directory:
     node server/database/migrate.js
     node server/database/seed.js
     ```
   - Confirm in your Neon SQL Editor that all 12 tables (`users`, `students`, `faculty`, `departments`, `attendance_records`, etc.) are created and populated.

---

## Part 2: Backend API Deployment (Render.com)

1. **Push Code to GitHub:**
   - Ensure the latest commit is pushed to your GitHub repository:
     ```bash
     git push origin master
     ```
2. **Create New Web Service on Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
   - Connect your GitHub repository: `rizvan-r/CollegeManagement`.
3. **Configure Service Settings:**
   - **Name:** `college-management-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
4. **Configure Environment Variables in Render:**
   Under **Environment Variables**, add:
   | Variable | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *Your Neon PostgreSQL connection string* |
   | `JWT_SECRET` | *Generate a 32+ character random string* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *Your Vercel URL (e.g. `https://college-management-client.vercel.app`) or `*`* |
5. **Deploy & Verify:**
   - Click **Create Web Service**.
   - Render will build and deploy your API. Once active, verify via the health check endpoint:
     `https://college-management-api.onrender.com/api/v1/health`

---

## Part 3: Frontend Deployment (Vercel)

1. **Import Project to Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
   - Select `rizvan-r/CollegeManagement`.
2. **Configure Root Directory & Build:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and select `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Configure Environment Variables:**
   Under **Environment Variables**, add:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://college-management-api.onrender.com/api/v1` |
4. **Deploy & Verify:**
   - Click **Deploy**.
   - Vercel will build the frontend assets.
   - The included [`client/vercel.json`](file:///i:/Richu/Projects/CollegeManagement/client/vercel.json) automatically routes all browser reloads (`/dashboard`, `/students`, etc.) through `index.html`.

---

## Part 4: Production Verification & Persistence Testing

Once deployed to public URLs:

1. **Live Auth Test:**
   - Open your Vercel public URL.
   - Log in using `admin@college.edu` and `Password@123`.
   - Verify the dashboard displays the active metrics and circulars.
2. **CRUD & Persistence Test:**
   - Create a new Department or Enroll a new Student through the portal UI.
   - Verify the new entry appears in the data table.
   - Open Neon SQL Editor and query `SELECT * FROM students ORDER BY created_at DESC LIMIT 1;` to confirm live cloud persistence.
   - Hard refresh (`Ctrl + F5`) the browser to confirm the record persists from Neon.
