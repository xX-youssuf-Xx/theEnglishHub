import { router } from './context';
import { authRouter } from '../routers/auth';
import { studentRouter } from '../routers/students';
import { teacherRouter } from '../routers/teachers';
import { courseRouter } from '../routers/courses';
import { classRouter } from '../routers/classes';
import { paymentRouter } from '../routers/payments';
import { reportRouter } from '../routers/reports';
import { sessionRouter } from '../routers/sessions';

export const appRouter = router({
  auth: authRouter,
  students: studentRouter,
  teachers: teacherRouter,
  courses: courseRouter,
  classes: classRouter,
  payments: paymentRouter,
  reports: reportRouter,
  sessions: sessionRouter,
});

export type AppRouter = typeof appRouter;
