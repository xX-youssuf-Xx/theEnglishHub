import { z } from "zod";
import { auditService } from "../services/audit";
import { sessionService } from "../services/sessions";
import { protectedProcedure, publicProcedure, router } from "../trpc/context";

export const sessionRouter = router({
	getWeeklySchedule: protectedProcedure
		.input(
			z.object({
				startDate: z.string(),
				endDate: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return sessionService.getWeeklySchedule(
				new Date(input.startDate),
				new Date(input.endDate),
			);
		}),

	markComplete: protectedProcedure
		.input(
			z.object({
				sessionId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;
			const result = await sessionService.markSessionComplete(
				input.sessionId,
				userId,
			);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "mark_session_complete",
				entityType: "session",
				newValues: {
					sessionId: input.sessionId,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	markAttendance: protectedProcedure
		.input(
			z.object({
				sessionId: z.string().uuid(),
				studentId: z.string().uuid(),
				attended: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await sessionService.markStudentAttendance(
				input.sessionId,
				input.studentId,
				input.attended,
			);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "mark_session_attendance",
				entityType: "session_attendance",
				newValues: {
					sessionId: input.sessionId,
					studentId: input.studentId,
					attended: input.attended,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	createForClass: protectedProcedure
		.input(
			z.object({
				classId: z.string().uuid(),
				startDate: z.string(),
				numberOfSessions: z.number().int().positive(),
			}),
		)
		.mutation(async ({ input }) => {
			return sessionService.createSessionsForClass(
				input.classId,
				new Date(input.startDate),
				input.numberOfSessions,
			);
		}),

	getStudentProgress: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				courseId: z.string().uuid(),
			}),
		)
		.query(async ({ input }) => {
			return sessionService.getStudentProgressInCourse(
				input.studentId,
				input.courseId,
			);
		}),

	generateSessionsForAllClasses: publicProcedure.mutation(async ({ ctx }) => {
		const result = await sessionService.generateSessionsForAllClasses();

		await auditService.logAction({
			userId: ctx.user?.id || null,
			action: "generate_sessions_for_month",
			entityType: "session",
			newValues: {
				totalSessionsCreated: result.totalSessionsCreated,
				classesProcessed: result.classesProcessed,
				month: result.month,
			},
			ipAddress: ctx.ipAddress,
			userAgent: ctx.userAgent,
		});

		return result;
	}),

	generateMissingPendingPayments: publicProcedure.mutation(async ({ ctx }) => {
		const result = await sessionService.generateMissingPendingPayments();

		await auditService.logAction({
			userId: ctx.user?.id || null,
			action: "generate_missing_pending_payments",
			entityType: "payment",
			newValues: {
				studentPaymentsCreated: result.studentPaymentsCreated,
				teacherPaymentsCreated: result.teacherPaymentsCreated,
			},
			ipAddress: ctx.ipAddress,
			userAgent: ctx.userAgent,
		});

		return result;
	}),

	getSessionDetails: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return sessionService.getSessionDetails(input);
		}),
});
