# College Management Portal – Mobile Application (Android)

This directory contains the standalone Android mobile application for the **College Management Portal (CMP)**. It connects directly to the existing Express REST API (`server/`) and Neon PostgreSQL database, ensuring unified business logic and zero backend code duplication.

---

## 📱 Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) (0.88.1) via [Expo](https://expo.dev/) (SDK 58)
- **Language**: JavaScript (ES6+)
- **Navigation & Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **HTTP Client**: [Axios](https://axios-http.com/) with request/response interceptors & token injection
- **Server State Management**: [@tanstack/react-query](https://tanstack.com/query/latest)
- **Secure Vault**: [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) for hardware-backed JWT storage
- **UI & Layout**: Custom modular components + `react-native-safe-area-context`
- **Initial Target**: Android (with deep link scheme `collegemanagement://`)

---

## 📁 Directory Structure

```text
mobile/
├── app/                          # Expo Router File-Based Routing
│   ├── _layout.jsx               # Root Layout (QueryClient, SafeArea, AuthProvider)
│   ├── index.jsx                 # Welcome Screen & API Connectivity Monitor
│   ├── (auth)/                   # Authentication route group (Phase 1)
│   │   ├── _layout.jsx
│   │   └── login.jsx
│   ├── (admin)/                  # Role 1: College Administrator
│   │   ├── _layout.jsx
│   │   └── index.jsx
│   ├── (hod)/                    # Role 2: Department Staff / HOD
│   │   ├── _layout.jsx
│   │   └── index.jsx
│   ├── (faculty)/                # Role 3: Faculty
│   │   ├── _layout.jsx
│   │   └── index.jsx
│   └── (student)/                # Role 4: Student
│       ├── _layout.jsx
│       └── index.jsx
├── src/                          # Shared Application Logic
│   ├── api/
│   │   ├── client.js             # Shared Axios instance with SecureStore interceptors
│   │   └── endpoints.js          # Centralized route registry matching Express API
│   ├── components/               # Modular UI Components
│   │   ├── common/
│   │   │   ├── Button.jsx        # Primary, secondary, outline, danger button
│   │   │   ├── Card.jsx          # Elevation card container
│   │   │   ├── Header.jsx        # Navigation header
│   │   │   └── LoadingSpinner.jsx# Feedback indicator
│   │   └── index.js
│   ├── constants/
│   │   ├── colors.js             # Consistent theme colors matching CMP web
│   │   ├── roles.js              # Role constants matching backend authorization
│   │   └── storageKeys.js        # SecureStore key constants
│   ├── context/
│   │   └── AuthContext.jsx       # Auth state provider and session manager
│   ├── hooks/
│   │   ├── useAuth.js            # Authentication hook
│   │   └── useApiStatus.js       # TanStack Query health check hook
│   └── services/
│       └── secureStorage.js      # Encapsulated SecureStore wrapper
├── .env.example                  # Environment template
├── .env                          # Local environment variables
├── app.json                      # Expo application metadata & Android package config
└── package.json                  # Mobile dependencies & run scripts
```

---

## ⚙️ Environment Configuration

Environment variables prefixed with `EXPO_PUBLIC_` are automatically exposed to the mobile bundle:

```env
# mobile/.env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1
EXPO_PUBLIC_APP_NAME="College Management Portal"
```

### Network Target Reference:
| Target Environment | `EXPO_PUBLIC_API_URL` Value | Details |
|---|---|---|
| **Android Emulator** | `http://10.0.2.2:5000/api/v1` | `10.0.2.2` aliases your development PC's `localhost` |
| **Physical Android Device** | `http://<YOUR_LAN_IP>:5000/api/v1` | e.g. `http://192.168.1.105:5000/api/v1` (Same Wi-Fi) |
| **Production (Render)** | `https://<render-service>.onrender.com/api/v1` | Deployed backend instance |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```
*(Or from root: `npm run mobile:install`)*

### 2. Start the Development Server
```bash
cd mobile
npm start
```
*(Or from root: `npm run mobile`)*

### 3. Run on Android
Press `a` in the Expo terminal menu, or execute:
```bash
npm run android
```
*(Or from root: `npm run mobile:android`)*

---

## 🔍 Diagnostics & Health Checks

- **Run Expo Doctor**:
  ```bash
  cd mobile
  npx expo-doctor
  ```
  *(Current status: 20/20 checks passed with 0 issues).*

- **Verify Android Compilation**:
  ```bash
  cd mobile
  npx expo export --platform android
  ```
  *(Compiles 1,200 modules directly into optimized Android Hermes bytecode).*

---

## 🔐 Architecture Principles & Features (Phase 1 Completed)

1. **Single Backend**: Communicates exclusively with the existing Node.js + Express API (`server/`).
2. **Single Database**: No secondary databases; all data queries route through Express to PostgreSQL.
3. **Hardware-Backed Tokens**: Uses `expo-secure-store` to isolate and persist JWT session tokens.
4. **Multi-Role Authentication**: Seamless login for all 4 roles via `/api/v1/auth/login`:
   - `ADMIN` → `/(admin)`
   - `DEPARTMENT_STAFF` → `/(hod)`
   - `FACULTY` → `/(faculty)`
   - `STUDENT` → `/(student)`
5. **Session Hydration & Auto-Signout**: Automatically restores active sessions on application launch; intercepts 401 Unauthorized responses to clear credentials.
6. **Authoritative Design System**:
   - Primary: `#1E3A8A` | Light: `#3B82F6` | Dark: `#1E293B` | Accent: `#0D9488`
   - Background: `#F8FAFC` | Surface: `#FFFFFF` | Border: `#E2E8F0`
   - Admin Accent: `#4F46E5` | HOD Accent: `#16A34A` | Faculty Accent: `#D97706` | Student Accent: `#059669`
7. **Isolated Web & Mobile**: Zero impact on the existing React + Vite web client (`client/`).

