import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
	classes as classesSchema,
	courseLevels,
	coursePrerequisites,
	courses as coursesSchema,
	teachers,
} from "../db/schema";
import { courseService } from "../services/courses";
import { adminProcedure, protectedProcedure, router } from "../trpc/context";

export const courseRouter = router({
	getAll: protectedProcedure.query(async () => {
		return courseService.getAll();
	}),

	getById: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return courseService.getById(input);
		}),

	create: adminProcedure
		.input(
			z.object({
				name: z.string().min(3),
				description: z.string().optional(),
				syllabus: z.string().optional(),
				sessionsPerMonth: z.number().int().min(1).max(31).default(4),
				prerequisiteCourseIds: z.array(z.string().uuid()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { prerequisiteCourseIds, ...courseData } = input;

			const result = await courseService.create(courseData);

			// Add course prerequisites if provided
			if (
				prerequisiteCourseIds &&
				prerequisiteCourseIds.length > 0 &&
				result.id
			) {
				await courseService.setCoursePrerequisites(
					result.id,
					prerequisiteCourseIds,
				);
			}

			return result;
		}),

	update: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: z.object({
					name: z.string().min(3).optional(),
					description: z.string().optional(),
					syllabus: z.string().optional(),
					sessionsPerMonth: z.number().int().min(1).max(31).optional(),
				}),
			}),
		)
		.mutation(async ({ input }) => {
			return courseService.update(input.id, input.data);
		}),

	delete: adminProcedure
		.input(z.string().uuid())
		.mutation(async ({ input }) => {
			return courseService.delete(input);
		}),

	// Level management
	getLevels: protectedProcedure
		.input(
			z.object({
				courseId: z.string().uuid(),
			}),
		)
		.query(async ({ input }) => {
			const course = await db.query.courses.findFirst({
				where: eq(coursesSchema.publicId, input.courseId),
				with: {
					levels: {
						with: {
							books: true,
							prerequisites: {
								with: {
									prerequisiteLevel: true,
								},
							},
						},
					},
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			return {
					data:
						course.levels?.map((level) => ({
							id: level.publicId,
							levelNumber: level.levelNumber,
							durationMonths: level.durationMonths,
							pricePerMonth: level.pricePerMonth,
							description: level.description,
							books:
								level.books?.map((b) => ({
									id: b.publicId,
									name: b.name,
									price: b.price,
								})) || [],
							prerequisites:
								level.prerequisites?.map((p) => ({
									id: p.prerequisiteLevel.publicId,
									levelNumber: p.prerequisiteLevel.levelNumber,
								})) || [],
					})) || [],
			};
		}),

	addLevel: adminProcedure
		.input(
			z.object({
				courseId: z.string().uuid(),
				levelNumber: z.number().int().positive(),
				durationMonths: z.number().int().positive().default(4),
				pricePerMonth: z.number().positive().optional(),
				description: z.string().optional(),
				books: z
					.array(
						z.object({
							name: z.string().min(1),
							price: z.number().positive(),
						}),
					)
					.optional(),
				prerequisiteLevelIds: z.array(z.string().uuid()).optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const { courseId, prerequisiteLevelIds, ...levelData } = input;

			// Resolve course UUID to ID
			const course = await db.query.courses.findFirst({
				where: eq(coursesSchema.publicId, courseId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			const result = await courseService.addLevel(courseId, levelData);

			// Set level prerequisites if provided
			if (
				prerequisiteLevelIds &&
				prerequisiteLevelIds.length > 0 &&
				result.id
			) {
				await courseService.setPrerequisites(result.id, prerequisiteLevelIds);
			}

			return result;
		}),

	setLevelPrerequisites: adminProcedure
		.input(
			z.object({
				levelId: z.string().uuid(),
				prerequisiteLevelIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ input }) => {
			return courseService.setPrerequisites(
				input.levelId,
				input.prerequisiteLevelIds,
			);
		}),

	// Course prerequisites
	setCoursePrerequisites: adminProcedure
		.input(
			z.object({
				courseId: z.string().uuid(),
				prerequisiteCourseIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ input }) => {
			return courseService.setCoursePrerequisites(
				input.courseId,
				input.prerequisiteCourseIds,
			);
		}),

	getCoursePrerequisites: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			const course = await db.query.courses.findFirst({
				where: eq(coursesSchema.publicId, input),
				with: {
					prerequisites: {
						with: {
							prerequisiteCourse: true,
						},
					},
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			return {
				data:
					course.prerequisites?.map((p) => ({
						id: p.prerequisiteCourse.publicId,
						name: p.prerequisiteCourse.name,
					})) || [],
			};
		}),

	// Class management
	getClasses: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			const course = await db.query.courses.findFirst({
				where: eq(coursesSchema.publicId, input),
				with: {
					classes: {
						where: eq(classesSchema.isActive, true),
						with: {
							level: true,
							teacher: true,
							teacherPayments: true,
							schedules: true,
							students: true,
						},
					},
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			return {
				data:
					course.classes?.map((cls) => ({
						id: cls.publicId,
						name: cls.name,
						level: {
							id: cls.level.publicId,
							levelNumber: cls.level.levelNumber,
						},
					teacher: cls.teacher
						? {
								id: cls.teacher.publicId,
								fullName: cls.teacher.fullName,
							}
						: null,
					teacherPayment: cls.teacherPayments?.[0]
						? {
								amount: cls.teacherPayments[0].paymentAmount,
								cycle: cls.teacherPayments[0].paymentCycle,
							}
						: null,
					schedules:
							cls.schedules
								?.filter((s) => s.isActive)
								.map((s) => ({
									dayOfWeek: s.dayOfWeek,
									startTime: s.startTime,
									endTime: s.endTime,
								})) || [],
						studentCount: cls.students?.filter((s) => s.isActive).length || 0,
					})) || [],
			};
		}),

	updateClass: adminProcedure
		.input(
			z.object({
				classId: z.string().uuid(),
				name: z.string().min(3).optional(),
				teacherId: z.string().uuid().optional(),
				levelId: z.string().uuid().optional(),
				teacherPaymentAmount: z.number().min(0).optional(),
				teacherPaymentCycle: z.enum(["4", "8"]).optional(),
				isActive: z.boolean().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const {
				classId,
				teacherId,
				levelId,
				teacherPaymentAmount,
				teacherPaymentCycle,
				...updateData
			} = input;

			let teacherIdNum: number | undefined;
			if (teacherId) {
				const teacher = await db.query.teachers.findFirst({
					where: eq(teachers.publicId, teacherId),
				});
				if (teacher) {
					teacherIdNum = teacher.id;
				}
			}

			let levelIdNum: number | undefined;
			if (levelId) {
				const level = await db.query.courseLevels.findFirst({
					where: eq(courseLevels.publicId, levelId),
				});
				if (level) {
					levelIdNum = level.id;
				}
			}

			return courseService.updateClass(classId, {
				...updateData,
				teacherId: teacherIdNum,
				levelId: levelIdNum,
				teacherPaymentAmount,
				teacherPaymentCycle,
			});
		}),

	createClass: adminProcedure
		.input(
			z.object({
				courseId: z.string().uuid(),
				name: z.string().min(3),
				levelId: z.string().uuid(),
				teacherId: z.string().uuid().optional(),
				teacherPaymentAmount: z.number().min(0).optional(),
				teacherPaymentCycle: z.enum(["4", "8"]).optional(),
				schedules: z
					.array(
						z.object({
							dayOfWeek: z.number().min(0).max(6),
							startTime: z.string(),
							endTime: z.string(),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ input }) => {
			const {
				courseId,
				levelId,
				teacherId,
				teacherPaymentAmount,
				teacherPaymentCycle,
				schedules,
				...classData
			} = input;

			// Resolve UUIDs to IDs
			const course = await db.query.courses.findFirst({
				where: eq(coursesSchema.publicId, courseId),
			});

			const level = await db.query.courseLevels.findFirst({
				where: eq(courseLevels.publicId, levelId),
			});

			if (!course || !level) {
				throw new Error("Course or level not found");
			}

			let teacherIdNum: number | undefined;
			if (teacherId) {
				const teacher = await db.query.teachers.findFirst({
					where: eq(teachers.publicId, teacherId),
				});
				if (teacher) {
					teacherIdNum = teacher.id;
				}
			}

			return courseService.createClass({
				...classData,
				courseId: course.id,
				levelId: level.id,
				teacherId: teacherIdNum,
				teacherPaymentAmount,
				teacherPaymentCycle,
				schedules,
			});
		}),

	deleteClass: adminProcedure
		.input(z.string().uuid())
		.mutation(async ({ input }) => {
			return courseService.deleteClass(input);
		}),
});
