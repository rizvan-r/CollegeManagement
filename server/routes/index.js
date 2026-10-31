import { Router } from 'express';
import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import studentRoutes from './studentRoutes.js';
import facultyRoutes from './facultyRoutes.js';
import courseRoutes from './courseRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import noticeRoutes from './noticeRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import aiRoutes from './aiRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/faculty', facultyRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/enrollments', enrollmentRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/notices', noticeRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/ai', aiRoutes);

export default apiRouter;
