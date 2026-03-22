import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { classes, courseLevels, courses } from "../db/schema";
import { studentService } from "../services/students";
import { adminProcedure, protectedProcedure, router } from "../trpc/context";

export const studentRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					search: z.string().optional(),
					classId: z.string().uuid().optional(),
					courseId: z.string().uuid().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return studentService.getAll(input || {});
		}),

	getById: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return studentService.getById(input);
		}),

	create: protectedProcedure
		.input(
			z.object({
				fullName: z.string().min(3),
				age: z.number().min(3).max(100).optional(),
				parentName: z.string().min(3),
				parentPhone: z.string(),
				address: z.string().min(3),
				emergencyContact: z.string(),
				classId: z.string().uuid().optional(),
				enrollments: z
					.array(
						z.object({
							courseId: z.string().uuid(),
							levelId: z.string().uuid(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve class UUID to ID if provided
			let classIdNumber: number | undefined;
			if (input.classId) {
				const classData = await db.query.classes.findFirst({
					where: eq(classes.publicId, input.classId),
				});
				if (classData) {
					classIdNumber = classData.id;
				}
			}

			// Resolve enrollment UUIDs to IDs
			let enrollmentsData: { courseId: number; levelId: number }[] | undefined;
			if (input.enrollments && input.enrollments.length > 0) {
				const coursePublicIds = input.enrollments.map((e) => e.courseId);
				const levelPublicIds = input.enrollments.map((e) => e.levelId);

				const courseRecords = await db.query.courses.findMany({
					where: inArray(courses.publicId, coursePublicIds),
				});

				const levelRecords = await db.query.courseLevels.findMany({
					where: inArray(courseLevels.publicId, levelPublicIds),
				});

				const courseIdMap = new Map(
					courseRecords.map((c) => [c.publicId, c.id]),
				);
				const levelIdMap = new Map(levelRecords.map((l) => [l.publicId, l.id]));

				enrollmentsData = input.enrollments
					.map((e) => ({
						courseId: courseIdMap.get(e.courseId) || 0,
						levelId: levelIdMap.get(e.levelId) || 0,
					}))
					.filter((e) => e.courseId > 0 && e.levelId > 0);
			}

			return studentService.create({
				fullName: input.fullName,
				age: input.age,
				parentName: input.parentName,
				parentPhone: input.parentPhone,
				address: input.address,
				emergencyContact: input.emergencyContact,
				classId: classIdNumber,
				enrollments: enrollmentsData,
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: z.object({
					fullName: z.string().min(3).optional(),
					age: z.number().min(3).max(100).optional(),
					parentName: z.string().min(3).optional(),
					parentPhone: z.string().optional(),
					address: z.string().min(3).optional(),
					emergencyContact: z.string().optional(),
					classId: z.string().uuid().optional(),
				}),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve class UUID to ID if provided
			let classIdNumber: number | undefined;
			if (input.data.classId) {
				const classData = await db.query.classes.findFirst({
					where: eq(classes.publicId, input.data.classId),
				});
				if (classData) {
					classIdNumber = classData.id;
				}
			}

			return studentService.update(input.id, {
				...input.data,
				classId: classIdNumber,
			});
		}),

	delete: adminProcedure
		.input(z.string().uuid())
		.mutation(async ({ input }) => {
			return studentService.delete(input);
		}),

	enrollInCourse: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				courseId: z.string().uuid(),
				levelId: z.string().uuid(),
				classId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve UUIDs to IDs
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, input.courseId),
			});

			const level = await db.query.courseLevels.findFirst({
				where: eq(courseLevels.publicId, input.levelId),
			});

			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, input.classId),
			});

			if (!course || !level || !classData) {
				throw new Error("Course, level, or class not found");
			}

			// Verify that the class belongs to the course and level
			if (classData.courseId !== course.id || classData.levelId !== level.id) {
				throw new Error(
					"The selected class does not match the course and level",
				);
			}

			return studentService.enrollInCourse(input.studentId, {
				courseId: course.id,
				levelId: level.id,
				classId: classData.id,
			});
		}),

	changeClass: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				enrollmentId: z.string().uuid(),
				newClassId: z.string().uuid(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve class UUID to ID
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, input.newClassId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			return studentService.changeClass(
				input.studentId,
				input.enrollmentId,
				classData.id,
				input.notes,
			);
		}),

	advanceLevel: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				enrollmentId: z.string().uuid(),
				newLevelId: z.string().uuid(),
				newClassId: z.string().uuid().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			// Resolve level UUID to ID
			const level = await db.query.courseLevels.findFirst({
				where: eq(courseLevels.publicId, input.newLevelId),
			});

			if (!level) {
				throw new Error("Level not found");
			}

			// Resolve optional class UUID to ID
			let classIdNumber: number | undefined;
			if (input.newClassId) {
				const classData = await db.query.classes.findFirst({
					where: eq(classes.publicId, input.newClassId),
				});
				if (classData) {
					classIdNumber = classData.id;
				}
			}

			return studentService.advanceLevel(
				input.studentId,
				input.enrollmentId,
				level.id,
				classIdNumber,
				input.notes,
			);
		}),

	completeCourse: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				enrollmentId: z.string().uuid(),
				finalGrade: z.string().optional(),
				notes: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return studentService.completeCourse(
				input.studentId,
				input.enrollmentId,
				{
					finalGrade: input.finalGrade,
					notes: input.notes,
				},
			);
		}),

	dropCourse: protectedProcedure
		.input(
			z.object({
				studentId: z.string().uuid(),
				enrollmentId: z.string().uuid(),
				reason: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			return studentService.dropCourse(
				input.studentId,
				input.enrollmentId,
				input.reason,
			);
		}),

	getCourseHistory: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return studentService.getCourseHistory(input);
		}),
});
