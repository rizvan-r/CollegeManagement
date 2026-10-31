-- ========================================================
-- COLLEGE MANAGEMENT PORTAL - INITIAL SEED DATA
-- Default Passwords: Password@123
-- Universal Demo bcrypt hash: $2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
-- All UUIDs formatted with valid RFC 4122 Hexadecimal characters [0-9a-f]
-- ========================================================

-- 1. Insert Academic Year
INSERT INTO academic_years (id, name, start_date, end_date, is_current)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '2025-2026', '2025-06-01', '2026-05-31', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Departments
INSERT INTO departments (id, code, name, building, established_year)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science and Engineering', 'Turing Block', 2005),
    ('d0000000-0000-0000-0000-000000000002', 'ECE', 'Electronics and Communication Engineering', 'Tesla Block', 2007),
    ('d0000000-0000-0000-0000-000000000003', 'MECH', 'Mechanical Engineering', 'Newton Hall', 2000),
    ('d0000000-0000-0000-0000-000000000004', 'MBA', 'Management Studies', 'Management Block', 2012)
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Users (Password: Password@123)
-- Hash: $2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES
    -- Admin
    ('11111111-1111-1111-1111-111111111101', 'admin@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'ADMIN', TRUE),
    -- Dept Staff / HOD
    ('11111111-1111-1111-1111-111111111102', 'hod.cse@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'DEPARTMENT_STAFF', TRUE),
    -- Faculty
    ('11111111-1111-1111-1111-111111111103', 'faculty.alan@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'FACULTY', TRUE),
    ('11111111-1111-1111-1111-111111111104', 'faculty.grace@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'FACULTY', TRUE),
    -- Students
    ('11111111-1111-1111-1111-111111111105', 'student.alex@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'STUDENT', TRUE),
    ('11111111-1111-1111-1111-111111111106', 'student.priya@college.edu', '$2b$10$MdwIZW4fiKMsO4Tt8HZ4qODLMsLFLWFv.ej35vmWSveR5Ij7oJw2y', 'STUDENT', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 4. Insert Faculty
INSERT INTO faculty (id, user_id, employee_id, first_name, last_name, department_id, designation, qualification, phone)
VALUES
    ('f1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', 'EMP-CSE-001', 'Robert', 'Vance', 'd0000000-0000-0000-0000-000000000001', 'Professor & HOD', 'Ph.D. in Computer Science', '+1-555-0101'),
    ('f1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111103', 'EMP-CSE-002', 'Alan', 'Turing', 'd0000000-0000-0000-0000-000000000001', 'Associate Professor', 'M.Tech, Ph.D.', '+1-555-0102'),
    ('f1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111104', 'EMP-CSE-003', 'Grace', 'Hopper', 'd0000000-0000-0000-0000-000000000001', 'Assistant Professor', 'M.Tech CSE', '+1-555-0103')
ON CONFLICT (employee_id) DO NOTHING;

-- Assign HOD to CSE Department
UPDATE departments 
SET hod_faculty_id = 'f1111111-1111-1111-1111-111111111101'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- 5. Insert Students
INSERT INTO students (id, user_id, admission_number, first_name, last_name, dob, gender, department_id, academic_year_id, current_semester, phone, guardian_name, guardian_contact)
VALUES
    ('51111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111105', 'CMP-2025-CSE-0001', 'Alex', 'Mercer', '2004-03-15', 'Male', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 3, '+1-555-0201', 'Thomas Mercer', '+1-555-0202'),
    ('51111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111106', 'CMP-2025-CSE-0002', 'Priya', 'Nair', '2004-07-22', 'Female', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 3, '+1-555-0203', 'Rajesh Nair', '+1-555-0204')
ON CONFLICT (admission_number) DO NOTHING;

-- 6. Insert Courses
INSERT INTO courses (id, code, title, department_id, credits, semester)
VALUES
    ('c1111111-1111-1111-1111-111111111101', 'CS301', 'Database Management Systems', 'd0000000-0000-0000-0000-000000000001', 4, 3),
    ('c1111111-1111-1111-1111-111111111102', 'CS302', 'Operating Systems Concepts', 'd0000000-0000-0000-0000-000000000001', 4, 3),
    ('c1111111-1111-1111-1111-111111111103', 'CS303', 'Theory of Computation', 'd0000000-0000-0000-0000-000000000001', 3, 3)
ON CONFLICT (code) DO NOTHING;

-- 7. Course Assignments (Dr. Alan teaches CS301 Section A)
INSERT INTO course_assignments (id, course_id, faculty_id, academic_year_id, section)
VALUES
    ('ca111111-1111-1111-1111-111111111101', 'c1111111-1111-1111-1111-111111111101', 'f1111111-1111-1111-1111-111111111102', 'a0000000-0000-0000-0000-000000000001', 'A')
ON CONFLICT (course_id, academic_year_id, section) DO NOTHING;

-- 8. Enrollments (Alex & Priya enrolled in CS301 Section A)
INSERT INTO enrollments (id, student_id, course_assignment_id, status)
VALUES
    ('e1111111-1111-1111-1111-111111111101', '51111111-1111-1111-1111-111111111101', 'ca111111-1111-1111-1111-111111111101', 'ENROLLED'),
    ('e1111111-1111-1111-1111-111111111102', '51111111-1111-1111-1111-111111111102', 'ca111111-1111-1111-1111-111111111101', 'ENROLLED')
ON CONFLICT (student_id, course_assignment_id) DO NOTHING;

-- 9. Insert Initial College Notices
INSERT INTO notices (id, title, content, priority, audience, author_id, publish_date)
VALUES
    ('b1111111-1111-1111-1111-111111111101', 'Commencement of Fall Semester 2025', 'Classes for the Fall 2025 academic session commence on June 15th. All students must report to their respective departments by 8:30 AM.', 'HIGH', 'COLLEGE_WIDE', '11111111-1111-1111-1111-111111111101', CURRENT_DATE),
    ('b1111111-1111-1111-1111-111111111102', 'CSE Department Annual Hackathon 2025', 'Registrations are open for HackTech 2025. Teams can submit proposals by the end of this month.', 'NORMAL', 'DEPARTMENT_ONLY', '11111111-1111-1111-1111-111111111102', CURRENT_DATE);
