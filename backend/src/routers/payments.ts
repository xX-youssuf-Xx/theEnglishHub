import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { classes, courses, students, teachers } from "../db/schema";
import { auditService } from "../services/audit";
import { paymentService } from "../services/payments";
import { adminProcedure, protectedProcedure, router } from "../trpc/context";

export const paymentRouter = router({
	// Student Payments
	getStudentPayments: protectedProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					studentId: z.string().uuid().optional(),
					classId: z.string().uuid().optional(),
					courseId: z.string().uuid().optional(),
					type: z.enum(["tuition", "books"]).optional(),
				})
				.optional(),
		)
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
		.input(
			z.object({
				studentId: z.string().uuid(),
				classId: z.string().uuid(),
				courseId: z.string().uuid(),
				type: z.enum(["tuition", "books"]),
				amount: z.number().positive(),
				sessionsCovered: z.number().optional(),
				paymentDate: z.coerce.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Resolve UUIDs to IDs
			const student = await db.query.students.findFirst({
				where: eq(students.publicId, input.studentId),
			});

			if (!student) {
				throw new Error("Student not found");
			}

			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, input.classId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, input.courseId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			const result = await paymentService.recordStudentPayment({
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

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "record_student_payment",
				entityType: "student_payment",
				newValues: {
					studentId: input.studentId,
					classId: input.classId,
					courseId: input.courseId,
					type: input.type,
					amount: input.amount,
					sessionsCovered: input.sessionsCovered,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	getPendingStudentPayments: protectedProcedure.query(async () => {
		return paymentService.getPendingStudentPayments();
	}),

	getPendingTeacherPayments: adminProcedure.query(async () => {
		return paymentService.getPendingTeacherPayments();
	}),

	// Teacher Payments
	getTeacherPayments: adminProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					teacherId: z.string().uuid().optional(),
					classId: z.string().uuid().optional(),
				})
				.optional(),
		)
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
		.input(
			z.object({
				teacherId: z.string().uuid(),
				classId: z.string().uuid(),
				amount: z.number().positive(),
				sessionsCovered: z.number().int().positive(),
				paymentDate: z.coerce.date().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Resolve UUIDs to IDs
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, input.teacherId),
			});

			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, input.classId),
			});

			if (!teacher || !classData) {
				throw new Error("Teacher or class not found");
			}

			const result = await paymentService.recordTeacherPayment({
				teacherId: teacher.id,
				classId: classData.id,
				amount: input.amount,
				sessionsCovered: input.sessionsCovered,
				paymentDate: input.paymentDate,
				notes: input.notes,
				recordedBy: ctx.user?.id,
			});

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "record_teacher_payment",
				entityType: "teacher_payment",
				newValues: {
					teacherId: input.teacherId,
					classId: input.classId,
					amount: input.amount,
					sessionsCovered: input.sessionsCovered,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	// Expenses
	getExpenses: adminProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					category: z.string().optional(),
					startDate: z.coerce.date().optional(),
					endDate: z.coerce.date().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return paymentService.getExpenses(input || {});
		}),

	recordExpense: adminProcedure
		.input(
			z.object({
				category: z.string(),
				amount: z.number().positive(),
				expenseDate: z.coerce.date().optional(),
				description: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await paymentService.recordExpense({
				...input,
				recordedBy: ctx.user?.id,
			});

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "record_expense",
				entityType: "expense",
				newValues: {
					category: input.category,
					amount: input.amount,
					expenseDate: input.expenseDate,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	deleteExpense: adminProcedure
		.input(z.string().uuid())
		.mutation(async ({ input, ctx }) => {
			const result = await paymentService.deleteExpense(input);

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "delete_expense",
				entityType: "expense",
				newValues: {
					expenseId: input,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	// Unified payment history
	getPaymentHistory: protectedProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					type: z.enum(["student", "teacher", "expense", "all"]).optional(),
					startDate: z.coerce.date().optional(),
					endDate: z.coerce.date().optional(),
				})
				.optional(),
		)
		.query(async ({ input, ctx }) => {
			const isAssistant = ctx.user.role === "assistant";
			const requestedType = input?.type;
			const effectiveType = isAssistant
				? requestedType === "all" ||
					requestedType === "student" ||
					requestedType === undefined
					? "student"
					: "student"
				: requestedType;

			return paymentService.getPaymentHistory({
				page: input?.page,
				limit: input?.limit,
				type: effectiveType,
				startDate: input?.startDate,
				endDate: input?.endDate,
			});
		}),

	// Settle pending payments
	settleStudentPayment: protectedProcedure
		.input(
			z.object({
				paymentId: z.string().uuid(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await paymentService.settleStudentPayment({
				paymentPublicId: input.paymentId,
				recordedBy: ctx.user?.id,
				notes: input.notes,
			});

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "settle_student_payment",
				entityType: "student_payment",
				newValues: {
					paymentId: input.paymentId,
					notes: input.notes,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	settleTeacherPayment: adminProcedure
		.input(
			z.object({
				paymentId: z.string().uuid(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await paymentService.settleTeacherPayment({
				paymentPublicId: input.paymentId,
				recordedBy: ctx.user?.id,
				notes: input.notes,
			});

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "settle_teacher_payment",
				entityType: "teacher_payment",
				newValues: {
					paymentId: input.paymentId,
					notes: input.notes,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	// Grouped pending payments
	getPendingPaymentsByTeacher: adminProcedure.query(async () => {
		return paymentService.getPendingPaymentsByTeacher();
	}),

	getPendingPaymentsByCourse: protectedProcedure.query(async () => {
		return paymentService.getPendingPaymentsByCourse();
	}),

	// Bulk operations
	bulkSettleTeacherPayments: adminProcedure
		.input(
			z.object({
				teacherId: z.string().uuid(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Resolve UUID to ID
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, input.teacherId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			const result = await paymentService.bulkSettleTeacherPayments({
				teacherId: teacher.id,
				recordedBy: ctx.user?.id,
				notes: input.notes,
			});

			await auditService.logAction({
				userId: ctx.user?.id,
				action: "bulk_settle_teacher_payments",
				entityType: "teacher_payment",
				entityId: teacher.id,
				newValues: {
					teacherId: input.teacherId,
					settledCount: result.settledCount,
					totalAmount: result.totalAmount,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),
});
