import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
	classes as classesSchema,
	courseLevels,
	courses,
	students,
} from "../db/schema";
import { classService } from "../services/classes";
import { protectedProcedure, router } from "../trpc/context";

export const classRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					teacherId: z.string().uuid().optional(),
					courseId: z.string().uuid().optional(),
					levelId: z.string().uuid().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return classService.getAll(input || {});
		}),

	getByCourseAndLevel: protectedProcedure
		.input(
			z.object({
				courseId: z.string().uuid(),
				levelId: z.string().uuid(),
			}),
		)
		.query(async ({ input }) => {
			// Resolve UUIDs to IDs
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, input.courseId),
			});

			const level = await db.query.courseLevels.findFirst({
				where: eq(courseLevels.publicId, input.levelId),
			});

			if (!course || !level) {
				throw new Error("Course or level not found");
			}

			const classesData = await db.query.classes.findMany({
				where: and(
					eq(classesSchema.courseId, course.id),
					eq(classesSchema.levelId, level.id),
					eq(classesSchema.isActive, true),
				),
				with: {
					teacher: true,
					schedules: true,
				},
			});

			return {
				data: classesData.map((cls) => ({
					id: cls.publicId,
					name: cls.name,
					teacher: cls.teacher
						? {
								id: cls.teacher.publicId,
								fullName: cls.teacher.fullName,
							}
						: null,
					schedules:
						cls.schedules
							?.filter((s) => s.isActive)
							.map((s) => ({
								id: s.publicId,
								dayOfWeek: s.dayOfWeek,
								startTime: s.startTime,
								endTime: s.endTime,
							})) || [],
				})),
			};
		}),

	getById: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return classService.getById(input);
		}),

	create: protectedProcedure
		.input(
			z.object({
				name: z.string().min(3),
				teacherId: z.string().uuid().optional(),
				scheduleDayOfWeek: z.number().min(0).max(6).optional(),
				scheduleStartTime: z.string().optional(),
				scheduleEndTime: z.string().optional(),
				startDate: z.coerce.date().optional(),
				teacherPayment: z
					.object({
						paymentAmount: z.number().positive(),
						paymentCycle: z.enum(["4", "8"]),
					})
					.optional(),
				studentIds: z.array(z.string().uuid()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return classService.create(input);
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: z.object({
					name: z.string().min(3).optional(),
					teacherId: z.string().uuid().optional(),
					scheduleDayOfWeek: z.number().min(0).max(6).optional(),
					scheduleStartTime: z.string().optional(),
					scheduleEndTime: z.string().optional(),
					startDate: z.coerce.date().optional(),
				}),
			}),
		)
		.mutation(async ({ input }) => {
			return classService.update(input.id, input.data);
		}),

	delete: protectedProcedure
		.input(z.string().uuid())
		.mutation(async ({ input }) => {
			return classService.delete(input);
		}),

	enrollStudents: protectedProcedure
		.input(
			z.object({
				classId: z.string().uuid(),
				studentIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve student UUIDs to IDs
			const studentRecords = await db.query.students.findMany({
				where: inArray(students.publicId, input.studentIds),
			});

			const studentIdNumbers = studentRecords.map((s) => s.id);

			return classService.enrollStudents(input.classId, studentIdNumbers);
		}),

	removeStudent: protectedProcedure
		.input(
			z.object({
				classId: z.string().uuid(),
				studentId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input }) => {
			return classService.removeStudent(input.classId, input.studentId);
		}),

	createSession: protectedProcedure
		.input(
			z.object({
				classId: z.string().uuid(),
				sessionDate: z.coerce.date(),
				startTime: z.string().optional(),
				endTime: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { classId, ...sessionData } = input;
			return classService.createSession(classId, sessionData);
		}),

	markSessionComplete: protectedProcedure
		.input(
			z.object({
				sessionId: z.string().uuid(),
				completed: z.boolean(),
			}),
		)
		.mutation(async ({ input }) => {
			return classService.markSessionComplete(input.sessionId, input.completed);
		}),
});
