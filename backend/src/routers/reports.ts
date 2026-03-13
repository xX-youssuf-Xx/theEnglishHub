import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc/context';
import { reportService } from '../services/reports';
import { db } from '../db';
import { classes, courses } from '../db/schema';
import { eq } from 'drizzle-orm';

export const reportRouter = router({
  getFinancialReport: adminProcedure
    .input(z.object({
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
    }))
    .query(async ({ input }) => {
      return reportService.getFinancialReport(input.startDate, input.endDate);
    }),

  getStudentPaymentReport: protectedProcedure
    .input(z.object({
      classId: z.string().uuid().optional(),
      courseId: z.string().uuid().optional(),
      status: z.enum(['paid', 'pending', 'overdue']).optional(),
    }).optional())
    .query(async ({ input }) => {
      // Resolve UUIDs to IDs if provided
      let classIdNum: number | undefined;
      let courseIdNum: number | undefined;

      if (input?.classId) {
        const classData = await db.query.classes.findFirst({
          where: eq(classes.publicId, input.classId),
        });
        classIdNum = classData?.id;
      }

      if (input?.courseId) {
        const course = await db.query.courses.findFirst({
          where: eq(courses.publicId, input.courseId),
        });
        courseIdNum = course?.id;
      }

      return reportService.getStudentPaymentReport({
        classId: classIdNum,
        courseId: courseIdNum,
        status: input?.status,
      });
    }),

  getTeacherPaymentSchedule: adminProcedure
    .query(async () => {
      return reportService.getTeacherPaymentSchedule();
    }),

  getEnrollmentReport: protectedProcedure
    .input(z.object({
      courseId: z.string().uuid().optional(),
      classId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Resolve UUIDs to IDs if provided
      let classIdNum: number | undefined;
      let courseIdNum: number | undefined;

      if (input?.classId) {
        const classData = await db.query.classes.findFirst({
          where: eq(classes.publicId, input.classId),
        });
        classIdNum = classData?.id;
      }

      if (input?.courseId) {
        const course = await db.query.courses.findFirst({
          where: eq(courses.publicId, input.courseId),
        });
        courseIdNum = course?.id;
      }

      return reportService.getEnrollmentReport({
        classId: classIdNum,
        courseId: courseIdNum,
      });
    }),

  getDashboardStats: protectedProcedure
    .query(async () => {
      return reportService.getDashboardStats();
    }),
});
