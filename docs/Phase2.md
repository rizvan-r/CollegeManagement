# College Management Portal – Mobile App
# Phase 2: Authentication and Authorization

Act as a senior React Native, Expo, Node.js and Express developer.

The College Management Portal contains:

- Web: React + Vite
- Mobile: React Native + Expo
- Backend: Node.js + Express
- Database: Remote Neon PostgreSQL
- Authentication: Existing JWT + bcrypt implementation
- Android target: All four user roles

Phase 0 and Phase 1 have been completed.

Your task is to implement Phase 2 only.

## 1. First inspect the existing project

Before writing code, inspect:

- Existing backend authentication routes.
- Authentication controllers and services.
- JWT generation and verification.
- Password verification with bcrypt.
- Existing user table and role values.
- Existing `/auth/login` endpoint.
- Existing `/auth/me` endpoint.
- Actual login request and response formats.
- Mobile AuthContext.
- Mobile Axios API client.
- Expo Router layouts.
- Existing SecureStore installation.
- Existing web login flow.

Do not assume the backend uses the sample response in the project instructions.

Document the actual API contract before implementing the mobile integration.

## 2. Mobile authentication implementation

Implement:

1. Real college credential login.
2. Login loading state.
3. Login validation.
4. Secure JWT storage using Expo SecureStore.
5. Authenticated user context.
6. Session restoration on app restart.
7. Authenticated profile retrieval.
8. Role-based dashboard redirection.
9. Logout.
10. Session expiration handling.
11. Consistent API error handling.

Do not store authentication tokens in AsyncStorage or ordinary files.

## 3. API integration

Use the existing Express API.

Expected endpoints:

POST /api/v1/auth/login

GET /api/v1/auth/me

Use the actual existing request and response contracts.

Create or update:
- src/services/api.js
- src/services/authService.js
- src/context/AuthContext.jsx

Use Axios request interceptors to attach the stored JWT to protected requests.

Handle HTTP 401 consistently. Clear invalid sessions and redirect to login without creating redirect loops.

Do not log credentials or token values.

## 4. Role management

Use these internal role identifiers if they match the existing backend:

- admin
- hod
- faculty
- student

If the backend uses different role identifiers, implement a centralized mapping.

Role navigation:

- admin -> /(admin)
- hod -> /(hod)
- faculty -> /(faculty)
- student -> /(student)

Do not trust a role supplied by an unverified client request.

## 5. Route protection

Protect every role-specific route group.

Requirements:

- Unauthenticated users cannot access dashboards.
- Admin users can access admin routes.
- HOD users can access HOD routes.
- Faculty users can access faculty routes.
- Students can access student routes.
- Wrong-role access must be denied or redirected.
- Loading state must be handled before rendering protected screens.
- Authenticated users visiting the login screen should be redirected to their dashboard.

Backend authorization must remain authoritative.

## 6. Login UI

Reuse the existing Phase 1 login screen and official color palette.

Official colors:

- Primary: #1E3A8A
- Primary Light: #3B82F6
- Primary Dark: #1E293B
- Accent: #0D9488
- Background: #F8FAFC
- Surface: #FFFFFF
- Border: #E2E8F0
- Primary text: #0F172A
- Secondary text: #64748B

Preserve the current visual design.

Add:

- Working username/email input matching the backend contract.
- Password input.
- Show/hide password.
- Login loading indicator.
- Error messages.
- Keyboard handling.
- Forgot password placeholder if no reset API exists.

Remove temporary role selection from the real authentication flow.

## 7. Session handling

On app startup:

1. Read the stored access token.
2. If no token exists, show login.
3. If a token exists, call the authenticated profile endpoint.
4. If valid, restore the user session.
5. If invalid or expired, clear the stored token and show login.
6. Handle API unavailability without falsely treating it as invalid credentials.

Implement refresh tokens only if the existing backend already supports a refresh-token mechanism or after obtaining approval for a compatible backend implementation.

## 8. Backend compatibility

Reuse the existing authentication implementation.

If an endpoint is missing or its response is incompatible:

- Report the exact issue.
- Identify the smallest backward-compatible backend change required.
- Preserve the existing web login contract.
- Do not modify database schema unnecessarily.
- Do not create a second authentication system.
- Document any backend change.

Do not silently replace existing working authentication code.

## 9. Security

- HTTPS for production API calls.
- SecureStore for tokens.
- No hardcoded secrets.
- No direct PostgreSQL connections.
- Server-side JWT verification.
- Server-side role authorization.
- Server-side resource ownership checks.
- Safe error handling.
- Clear cached user-specific data on logout.

## 10. Testing

Test with real existing accounts for all four roles.

Verify:
- Valid login.
- Invalid credentials.
- Empty fields.
- Role-specific navigation.
- App restart and session restoration.
- Logout.
- Expired token.
- Unauthorized route access.
- API unavailable.
- Android physical device operation.

Ensure the web application continues to authenticate correctly.

## 11. Deliverables

Provide:

- Complete updated mobile source code.
- Authentication service.
- AuthContext.
- Secure token storage.
- Protected route implementation.
- Role-based navigation.
- API contract documentation.
- Backend changes, if any.
- Testing report.
- Android screenshots.

Complete Phase 2 only.

Do not begin Phase 3. Report the implementation and verification results, identify any unresolved issues, and wait for my explicit approval.