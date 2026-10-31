# MASTER PLAN PROMPT – COLLEGE MANAGEMENT PORTAL

## 1. Project Overview

Act as a Senior Full-Stack Software Architect, Database Designer, UI/UX Designer, and Technical Project Manager.

Design a complete, production-oriented **College Management Portal (CMP)** that centralizes college administration and academic operations.

**Project Name:** College Management Portal  
**Tagline:** One Campus. One Platform. Complete Management.

The application must support student enrollment, faculty records, department management, course allocation, attendance tracking, internal notices, and role-based dashboards.

The goal is to build a functional, secure, scalable, and remotely deployed web application suitable for academic project evaluation and real-world institutional use.

IMPORTANT: This task is to prepare the complete MASTER PLAN and technical blueprint. Do not begin implementing the application until the master plan is finalized.

---

## 2. Mandatory Technology Stack

Use the following selected technologies.

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Reusable component architecture

### Backend
- Node.js
- Express.js
- REST API architecture
- JavaScript
- JWT authentication
- bcrypt password hashing
- Zod or Joi validation

### Database
- PostgreSQL
- Remote managed PostgreSQL hosting through Neon
- PostgreSQL driver: node-postgres (`pg`)
- SQL-based database operations
- Relational database design

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL
- Version control: GitHub

### API Testing
- Postman

Do not change these selected technologies without explaining a technical necessity and obtaining approval.

---

## 3. Important Restrictions

The following restrictions are mandatory.

1. Firebase is strictly prohibited.
2. Supabase is strictly prohibited.
3. Other Backend-as-a-Service platforms are prohibited.
4. Local-only SQLite databases are prohibited.
5. Local-only database servers without remote accessibility are not acceptable.
6. The database must be remotely deployed and accessible.
7. The frontend must never connect directly to the database.
8. All database operations must pass through the Express backend API.
9. All CRUD operations must work with actual deployed database records.
10. Data must persist after browser refresh and application restart.

The application must demonstrate genuine backend-to-remote-database integration.

---

## 4. User Roles

Implement four primary user roles.

### Role 1: College Administrator
- Manage all users.
- Create and manage departments.
- Manage students and faculty.
- Manage courses and academic years.
- View institutional reports.
- Publish college-wide notices.
- Manage institutional settings.
- Control user permissions.

### Role 2: Department Staff / HOD
- Manage department students.
- Manage department faculty records.
- Manage department courses.
- Assign faculty to courses.
- Monitor attendance.
- Publish department notices.
- View department reports.

### Role 3: Faculty
- View assigned courses.
- View enrolled students.
- Mark student attendance.
- Update authorized attendance records.
- View attendance summaries.
- Access academic information.

### Role 4: Student
- View personal profile.
- View enrollment details.
- View registered courses.
- Check attendance history.
- View attendance percentage.
- Read college announcements.
- Read department notices.

Implement strict role-based authorization in the backend.

Do not rely only on frontend route protection.

---

## 5. Core Functional Modules

Design the system around these eight modules.

### Module 1: Authentication and User Management
- Login and logout.
- JWT-based authentication.
- bcrypt password hashing.
- Role-based authorization.
- User profile management.
- Account activation and deactivation.
- Password change functionality.

### Module 2: Student Enrollment Management
- Student registration.
- Unique admission number generation.
- Personal information management.
- Academic information management.
- Department allocation.
- Academic year allocation.
- Student search and filtering.
- Student CRUD operations.
- Student record archiving.

### Module 3: Faculty Management
- Faculty registration.
- Unique employee ID.
- Faculty qualifications.
- Department allocation.
- Contact information.
- Employment status.
- Faculty CRUD operations.

### Module 4: Department Management
- Department creation.
- Department editing.
- Department head assignment.
- Faculty allocation.
- Student allocation.
- Department statistics.
- Department CRUD operations.

### Module 5: Course Management
- Course creation.
- Subject management.
- Course codes.
- Semester management.
- Academic year management.
- Faculty-course assignment.
- Course enrollment.
- Credit management.
- Course CRUD operations.

### Module 6: Attendance Management
- Attendance session creation.
- Daily attendance marking.
- Present, absent, and on-duty statuses.
- Attendance history.
- Authorized attendance updates.
- Attendance percentage calculation.
- Semester-wise attendance reports.

Use the formula:

Attendance Percentage = (Classes Present / Total Classes Conducted) × 100

Define clearly how on-duty records are treated in attendance calculations.

### Module 7: Internal Notices and Announcements
- Create notices.
- Edit notices.
- Delete notices.
- College-wide announcements.
- Department-specific announcements.
- Publication dates.
- Expiry dates.
- Notice visibility rules.

### Module 8: Dashboard and Reporting
Create separate dashboards for all four roles.

Admin dashboard:
- Total students.
- Total faculty.
- Total departments.
- Total courses.
- Recent activities.
- Institutional summaries.

Department dashboard:
- Department student count.
- Faculty count.
- Course count.
- Attendance summaries.
- Department notices.

Faculty dashboard:
- Assigned courses.
- Enrolled students.
- Attendance management.
- Recent notices.

Student dashboard:
- Personal academic details.
- Registered courses.
- Attendance percentage.
- Attendance history.
- Recent announcements.

All dashboard statistics must come from actual database queries, not hardcoded values.

---

## 6. Database Master Design

Design a normalized PostgreSQL relational database.

Include at least the following tables:

1. users
2. students
3. faculty
4. departments
5. academic_years
6. courses
7. course_assignments
8. enrollments
9. attendance_sessions
10. attendance_records
11. notices
12. audit_logs

For each table, specify:

- Column names.
- PostgreSQL data types.
- Primary keys.
- Foreign keys.
- Unique constraints.
- NOT NULL constraints.
- Default values.
- Indexes.
- Relationships.
- Created and updated timestamps.

### Database design requirements

- Use appropriate primary and foreign keys.
- Prevent duplicate student enrollment.
- Prevent duplicate attendance entries for the same session.
- Ensure unique admission numbers.
- Ensure unique employee IDs.
- Ensure unique course codes within the appropriate scope.
- Maintain referential integrity.
- Use transactions for related database operations.
- Prevent accidental deletion of historical academic records.
- Design suitable indexes for frequently queried data.
- Use migrations for database version management.

Generate a complete Entity Relationship Diagram using Mermaid.

Explain all one-to-one, one-to-many, and many-to-many relationships.

Provide the complete proposed database schema, but do not execute it until the database phase begins.

---

## 7. Backend Architecture

Design a modular Express.js REST API.

Use the base URL:

`/api/v1`

Organize the backend into:

- config
- controllers
- services
- repositories
- routes
- middleware
- validators
- database
- utils

Define API endpoints for:

- Authentication.
- Users.
- Students.
- Faculty.
- Departments.
- Courses.
- Enrollments.
- Attendance.
- Notices.
- Dashboard statistics.

For every endpoint specify:

1. HTTP method.
2. Endpoint URL.
3. Purpose.
4. Required role.
5. Request body.
6. Expected response.
7. Possible error responses.

Use parameterized SQL queries.

Include:
- Authentication middleware.
- Role authorization middleware.
- Department ownership verification.
- Input validation.
- Centralized error handling.
- Consistent JSON response structure.
- Pagination.
- Search and filtering.
- API versioning.

---

## 8. Frontend Architecture and UI/UX

Design a modern institutional SaaS interface.

### Design system

- Primary: Navy Blue `#163A63`
- Secondary: Teal `#0F9D94`
- Background: `#F5F7FA`
- Cards: `#FFFFFF`
- Text: `#172B4D`
- Typography: Inter
- Layout: Sidebar + Top Navigation
- Initial theme: Light mode
- Responsive: Desktop, tablet, mobile

### UI requirements

Create:
- Public login page.
- Admin dashboard.
- Department dashboard.
- Faculty dashboard.
- Student dashboard.
- Student management page.
- Faculty management page.
- Department management page.
- Course management page.
- Enrollment page.
- Attendance management page.
- Notices page.
- Reports page.
- Profile page.

### Reusable components

- Sidebar.
- Navbar.
- Statistics cards.
- Data tables.
- Search components.
- Filters.
- Pagination.
- Form components.
- Modal dialogs.
- Confirmation dialogs.
- Toast notifications.
- Loading indicators.
- Empty states.
- Error states.

Explain the navigation structure and role-specific visibility.

Do not create four completely unrelated interfaces. Maintain a consistent design system across all dashboards.

---

## 9. Project Folder Structure

Prepare a complete project structure.

Use separate frontend and backend applications inside one GitHub repository.

Include:

- Frontend source.
- Backend source.
- Database migrations.
- Database seed files.
- Environment examples.
- Documentation.
- API documentation.
- Testing documentation.
- README.

Explain the responsibility of every major directory.

---

## 10. Remote Database Deployment Plan

Use Neon PostgreSQL for remote database hosting.

Define the complete deployment procedure:

1. Create a remote PostgreSQL project.
2. Obtain the connection string.
3. Configure secure database access.
4. Create database schema.
5. Apply migrations.
6. Insert seed data.
7. Connect the Express backend.
8. Verify remote connectivity.
9. Test database CRUD operations.
10. Verify persistent storage.

Use environment variables.

Backend environment example:

PORT=5000  
NODE_ENV=development  
DATABASE_URL=your_remote_database_url  
JWT_SECRET=your_secure_secret  
JWT_EXPIRES_IN=1d  
CLIENT_URL=http://localhost:5173

Frontend environment example:

VITE_API_BASE_URL=http://localhost:5000/api/v1

Never expose database credentials or JWT secrets in frontend code.

Explain production environment configuration separately from development configuration.

---

## 11. Security Requirements

Include:

- bcrypt password hashing.
- JWT-based authentication.
- Role-based authorization.
- Department-level access restrictions.
- SQL injection prevention.
- Input validation.
- Secure environment variables.
- HTTPS.
- Database SSL.
- CORS configuration.
- Rate limiting.
- Secure error handling.
- Audit logging.
- Database backup and recovery.

Students must only access their own academic records.

Faculty must only manage their authorized courses and attendance.

Department staff must only manage their authorized department.

College administrators must have institutional management privileges.

---

## 12. Testing and Evaluation Plan

Prepare a complete testing strategy.

### CRUD Testing

Demonstrate Create, Read, Update and Delete operations for:

- Students.
- Faculty.
- Departments.
- Courses.
- Enrollments.
- Notices.

Demonstrate appropriate create, read and update operations for attendance records.

### Persistence Testing

Verify:

1. Create a record through the frontend.
2. Confirm it appears in the remote database.
3. Refresh the browser.
4. Confirm the record remains.
5. Restart the frontend.
6. Confirm the record remains.
7. Restart the backend.
8. Confirm the database records remain accessible.

### Additional testing

- Authentication tests.
- Authorization tests.
- API integration tests.
- Database relationship tests.
- Input validation tests.
- Error handling tests.
- Responsive UI tests.
- Deployment tests.

Prepare a final evaluation checklist.

---

## 13. Development Roadmap

Divide the project into ten implementation phases.

### Phase 0 – Project Setup
- Environment installation.
- GitHub repository.
- Frontend initialization.
- Backend initialization.
- Project structure.
- Environment configuration.

### Phase 1 – Remote Database
- Neon setup.
- PostgreSQL schema.
- Relationships.
- Constraints.
- Indexes.
- Migrations.
- Seed data.
- Connectivity verification.

### Phase 2 – Backend Foundation
- Express server.
- PostgreSQL connection.
- Database repository layer.
- REST API structure.
- Error handling.
- API testing.

### Phase 3 – Authentication and Authorization
- Login and logout.
- JWT.
- bcrypt.
- Role middleware.
- Protected routes.
- Permission verification.

### Phase 4 – Core Management Modules
- Students.
- Faculty.
- Departments.
- Courses.
- Enrollments.
- CRUD implementation.

### Phase 5 – Academic Operations
- Attendance.
- Attendance calculations.
- Notices.
- Department announcements.

### Phase 6 – Frontend Development
- Design system.
- Authentication pages.
- Role-based dashboards.
- Management pages.
- Forms and tables.
- API integration.

### Phase 7 – Analytics and Reports
- Dashboard statistics.
- Attendance reports.
- Department summaries.
- Course statistics.

### Phase 8 – Testing and Security
- Complete CRUD verification.
- API testing.
- Authorization testing.
- Persistence testing.
- Security checks.
- UI testing.

### Phase 9 – Production Deployment
- Deploy frontend to Vercel.
- Deploy backend to Render.
- Configure Neon PostgreSQL.
- Production environment variables.
- Public URL testing.
- Documentation.
- Final demonstration.

---

## 14. Development Rules

Follow these rules throughout the project.

1. Work strictly according to the approved master plan.
2. Follow the phases sequentially.
3. Never skip environment verification.
4. Never assume a package or dependency is installed.
5. Provide exact Windows terminal commands where required.
6. Explain the purpose of important commands.
7. Maintain consistent naming conventions.
8. Do not hardcode dashboard statistics.
9. Do not use mock data as a substitute for actual database integration.
10. Keep frontend, backend, and database responsibilities separate.
11. Test every module before declaring it complete.
12. Do not break existing working functionality when implementing new modules.
13. Keep optional features separate from mandatory MVP requirements.
14. Document important technical decisions.
15. Do not move to the next phase without explicit completion verification.

When code is required, provide complete, executable files rather than disconnected fragments.

When modifying an existing file, preserve unrelated working functionality.

If an implementation decision is uncertain, explain the alternatives and recommend one rather than silently changing the architecture.

---

## 15. Required Master Plan Deliverables

Before starting implementation, produce the following documents and outputs:

1. Complete project requirement specification.
2. Project objectives and problem statement.
3. Functional requirements.
4. Non-functional requirements.
5. User roles and permission matrix.
6. Complete system architecture.
7. Architecture diagram.
8. Database design.
9. Complete ER diagram.
10. Proposed SQL schema.
11. Backend API specification.
12. Frontend page and navigation structure.
13. UI/UX design system.
14. Complete folder structure.
15. Authentication and security design.
16. Remote deployment architecture.
17. CRUD testing strategy.
18. Persistence verification strategy.
19. Phase-wise development roadmap.
20. Final evaluation checklist.

For each deliverable, explain its purpose and how it will be used during implementation.

---

## 16. Final Instruction

First, analyze the entire project requirement and identify any missing technical decisions.

Then prepare a comprehensive, professional, implementation-ready MASTER PLAN.

Do not start Phase 0 automatically.

Do not generate the entire application code in one response.

Do not skip architectural or database planning.

The final master plan must be detailed enough that a beginner developer can implement the application phase by phase using an AI coding assistant.

**The master plan must prioritize remote database compliance, complete CRUD functionality, secure backend integration, data persistence, and successful production deployment.**