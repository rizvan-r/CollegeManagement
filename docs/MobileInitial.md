# College Management Portal – Mobile App Phase 0

Act as a senior React Native and Expo developer.

I have an existing College Management Portal with:

- Frontend: React + Vite + JavaScript
- Backend: Node.js + Express REST API
- Database: Remote Neon PostgreSQL
- Web hosting: Cloudflare
- Backend hosting: Render

I need a separate Android mobile application that shares the existing backend API and database.

## Technology requirements

- React Native
- Expo
- JavaScript
- Expo Router
- Axios
- TanStack Query
- Expo SecureStore
- Android as the initial target

## User roles

1. College Administrator
2. Department Staff / HOD
3. Faculty
4. Student

## Phase 0 tasks

1. Inspect the existing project structure before making changes.
2. Create a separate `mobile/` directory.
3. Initialize an Expo project with Expo Router.
4. Install and verify compatible dependencies.
5. Configure application name, slug, Android package name and deep-link scheme.
6. Configure environment variables for the existing backend API URL.
7. Create the mobile folder structure for all four roles.
8. Create the shared API client using Axios.
9. Prepare placeholders for authentication, storage and shared components.
10. Configure the application entry point and root navigation.
11. Add a basic welcome screen identifying the College Management Portal.
12. Verify the application starts successfully on Android.
13. Run Expo Doctor and resolve applicable configuration errors.

## Architecture rules

- Do not create a second backend.
- Do not create another database.
- Do not connect React Native directly to PostgreSQL.
- Do not modify the existing working web application.
- Do not put database credentials or JWT secrets in frontend environment variables.
- Keep mobile and web code separate.
- Use reusable components and clean folder organization.
- Use the existing Express API as the single source of backend data.

## Important implementation rules

- Inspect files before modifying them.
- Do not overwrite existing project configuration unnecessarily.
- Provide complete executable code.
- Explain every important installation command.
- Do not use mock statistics as real data.
- Keep future role-specific functionality outside Phase 0.

## Deliverables

- Working Expo mobile project
- Organized mobile directory structure
- Configured Android application
- Shared API client foundation
- Environment configuration
- Successful Android startup
- Setup documentation
- Phase 0 verification report

Do not start Phase 1 or implement authentication yet. Finish Phase 0, test it, report the results, and wait for my approval.