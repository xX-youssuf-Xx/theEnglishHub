import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc/context';
import { paymentService } from '../services/payments';
import { db } from '../db';
import { students, classes, teachers, courses } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const paymentRouter = router({
  // Student Payments
  getStudentPayments: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      studentId: z.string().uuid().optional(),
      classId: z.string().uuid().optional(),
      courseId: z.string().uuid().optional(),
      type: z.enum(['tuition', 'books']).optional(),
    }).optional())
    .query(async ({ input }) => {
      // Resolve UUIDs to IDs if provided
      let studentIdNum: number | undefined;
      let classIdNum: number | undefined;
      let courseIdNum: number | undefined;

      if (input?.studentId) {
        const student = await db.query.students.findFirst({
          where: eq(students.publicId, input.studentId),
        });
        studentIdNum = student?.id;
      }

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

      return paymentService.getStudentPayments({
        page: input?.page,
        limit: input?.limit,
        studentId: studentIdNum,
        classId: classIdNum,
        courseId: courseIdNum,
        type: input?.type,
      });
    }),

  recordStudentPayment: protectedProcedure
    .input(z.object({
      studentId: z.string().uuid(),
      classId: z.string().uuid(),
      courseId: z.string().uuid(),
      type: z.enum(['tuition', 'books']),
      amount: z.number().positive(),
      sessionsCovered: z.number().optional(),
      paymentDate: z.coerce.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve UUIDs to IDs
      const student = await db.query.students.findFirst({
        where: eq(students.publicId, input.studentId),
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const classData = await db.query.classes.findFirst({
        where: eq(classes.publicId, input.classId),
      });

      if (!classData) {
        throw new Error('Class not found');
      }

      const course = await db.query.courses.findFirst({
        where: eq(courses.publicId, input.courseId),
      });

      if (!course) {
        throw new Error('Course not found');
      }

      return paymentService.recordStudentPayment({
        studentId: student.id,
        classId: classData.id,
        courseId: course.id,
        type: input.type,
        amount: input.amount,
        sessionsCovered: input.sessionsCovered,
        paymentDate: input.paymentDate,
        notes: input.notes,
        recordedBy: ctx.user?.id,
      });
    }),

  getPendingStudentPayments: protectedProcedure
    .query(async () => {
      return paymentService.getPendingStudentPayments();
    }),

  getPendingTeacherPayments: protectedProcedure
    .query(async () => {
      return paymentService.getPendingTeacherPayments();
    }),

  // Teacher Payments
  getTeacherPayments: adminProcedure
    .input(z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      teacherId: z.string().uuid().optional(),
      classId: z.string().uuid().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Resolve UUIDs to IDs if provided
      let teacherIdNum: number | undefined;
      let classIdNum: number | undefined;

      if (input?.teacherId) {
        const teacher = await db.query.teachers.findFirst({
          where: eq(teachers.publicId, input.teacherId),
        });
        teacherIdNum = teacher?.id;
      }

      if (input?.classId) {
        const classData = await db.query.classes.findFirst({
          where: eq(classes.publicId, input.classId),
        });
        classIdNum = classData?.id;
      }

      return paymentService.getTeacherPayments({
        page: input?.page,
        limit: input?.limit,
        teacherId: teacherIdNum,
        classId: classIdNum,
      });
    }),

  recordTeacherPayment: adminProcedure
    .input(z.object({
      teacherId: z.string().uuid(),
      classId: z.string().uuid(),
      amount: z.number().positive(),
      sessionsCovered: z.number().int().positive(),
      paymentDate: z.coerce.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve UUIDs to IDs
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.publicId, input.teacherId),
      });

      const classData = await db.query.classes.findFirst({
        where: eq(classes.publicId, input.classId),
      });

      if (!teacher || !classData) {
        throw new Error('Teacher or class not found');
      }

      return paymentService.recordTeacherPayment({
        teacherId: teacher.id,
        classId: classData.id,
        amount: input.amount,
        sessionsCovered: input.sessionsCovered,
        paymentDate: input.paymentDate,
        notes: input.notes,
        recordedBy: ctx.user?.id,
      });
    }),

  // Expenses
  getExpenses: adminProcedure
    .input(z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      category: z.string().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }).optional())
    .query(async ({ input }) => {
      return paymentService.getExpenses(input || {});
    }),

  recordExpense: adminProcedure
    .input(z.object({
      category: z.string(),
      amount: z.number().positive(),
      expenseDate: z.coerce.date().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return paymentService.recordExpense({
        ...input,
        recordedBy: ctx.user?.id,
      });
    }),

  deleteExpense: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ input }) => {
      return paymentService.deleteExpense(input);
    }),

  // Unified payment history
  getPaymentHistory: protectedProcedure
    .input(z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      type: z.enum(['student', 'teacher', 'expense', 'all']).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }).optional())
    .query(async ({ input }) => {
      return paymentService.getPaymentHistory({
        page: input?.page,
        limit: input?.limit,
        type: input?.type,
        startDate: input?.startDate,
        endDate: input?.endDate,
      });
    }),

  // Settle pending payments
  settleStudentPayment: adminProcedure
    .input(z.object({
      paymentId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return paymentService.settleStudentPayment({
        paymentPublicId: input.paymentId,
        recordedBy: ctx.user?.id,
        notes: input.notes,
      });
    }),

  settleTeacherPayment: adminProcedure
    .input(z.object({
      paymentId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return paymentService.settleTeacherPayment({
        paymentPublicId: input.paymentId,
        recordedBy: ctx.user?.id,
        notes: input.notes,
      });
    }),

  // Grouped pending payments
  getPendingPaymentsByTeacher: protectedProcedure
    .query(async () => {
      return paymentService.getPendingPaymentsByTeacher();
    }),

  getPendingPaymentsByCourse: protectedProcedure
    .query(async () => {
      return paymentService.getPendingPaymentsByCourse();
    }),

  // Bulk operations
  bulkSettleTeacherPayments: adminProcedure
    .input(z.object({
      teacherId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Resolve UUID to ID
      const teacher = await db.query.teachers.findFirst({
        where: eq(teachers.publicId, input.teacherId),
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      return paymentService.bulkSettleTeacherPayments({
        teacherId: teacher.id,
        recordedBy: ctx.user?.id,
        notes: input.notes,
      });
    }),
});
