import { auditRouter } from "../routers/audit";
import { authRouter } from "../routers/auth";
import { classRouter } from "../routers/classes";
import { courseRouter } from "../routers/courses";
import { paymentRouter } from "../routers/payments";
import { reportRouter } from "../routers/reports";
import { sessionRouter } from "../routers/sessions";
import { studentRouter } from "../routers/students";
import { teacherRouter } from "../routers/teachers";
import { router } from "./context";

export const appRouter = router({
	auth: authRouter,
	students: studentRouter,
	teachers: teacherRouter,
	courses: courseRouter,
	classes: classRouter,
	payments: paymentRouter,
	reports: reportRouter,
	sessions: sessionRouter,
	audit: auditRouter,
});

export type AppRouter = typeof appRouter;
