import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { classes } from "../db/schema";
import { auditService } from "../services/audit";
import { teacherService } from "../services/teachers";
import { adminProcedure, protectedProcedure, router } from "../trpc/context";

export const teacherRouter = router({
	getAll: protectedProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					search: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return teacherService.getAll(input || {});
		}),

	getById: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return teacherService.getById(input);
		}),

	create: protectedProcedure
		.input(
			z.object({
				fullName: z.string().min(3),
				phone: z.string().optional(),
				email: z.string().email().optional(),
				address: z.string().optional(),
				classAssignments: z
					.array(
						z.object({
							classId: z.string().uuid(),
							paymentAmount: z.number().positive(),
							paymentCycle: z.enum(["4", "8"]),
						}),
					)
					.optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Resolve class UUIDs to IDs
			let classAssignmentsData:
				| { classId: number; paymentAmount: number; paymentCycle: "4" | "8" }[]
				| undefined;

			if (input.classAssignments && input.classAssignments.length > 0) {
				const classPublicIds = input.classAssignments.map((ca) => ca.classId);

				const classRecords = await db.query.classes.findMany({
					where: inArray(classes.publicId, classPublicIds),
				});

				const classIdMap = new Map(classRecords.map((c) => [c.publicId, c.id]));

				classAssignmentsData = input.classAssignments
					.map((ca) => ({
						classId: classIdMap.get(ca.classId) || 0,
						paymentAmount: ca.paymentAmount,
						paymentCycle: ca.paymentCycle,
					}))
					.filter((ca) => ca.classId > 0);
			}

			const result = await teacherService.create({
				fullName: input.fullName,
				phone: input.phone,
				email: input.email,
				address: input.address,
				classAssignments: classAssignmentsData,
			});

			await auditService.logAction({
				userId: ctx.user.id,
				action: "create_teacher",
				entityType: "teacher",
				newValues: {
					teacherId: result.id,
					fullName: result.fullName,
					classAssignmentsCount: classAssignmentsData?.length || 0,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				data: z.object({
					fullName: z.string().min(3).optional(),
					phone: z.string().optional(),
					email: z.string().email().optional(),
					address: z.string().optional(),
				}),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await teacherService.update(input.id, input.data);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "update_teacher",
				entityType: "teacher",
				newValues: {
					teacherId: input.id,
					changedFields: Object.keys(input.data),
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	delete: adminProcedure
		.input(z.string().uuid())
		.mutation(async ({ input, ctx }) => {
			const result = await teacherService.delete(input);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "delete_teacher",
				entityType: "teacher",
				newValues: {
					teacherId: input,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	assignToClass: protectedProcedure
		.input(
			z.object({
				teacherId: z.string().uuid(),
				classId: z.string().uuid(),
				paymentAmount: z.number().positive(),
				paymentCycle: z.enum(["4", "8"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			// Resolve class UUID to ID
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, input.classId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const result = await teacherService.assignToClass(input.teacherId, {
				classId: classData.id,
				paymentAmount: input.paymentAmount,
				paymentCycle: input.paymentCycle,
			});

			await auditService.logAction({
				userId: ctx.user.id,
				action: "assign_teacher_to_class",
				entityType: "class_teacher_assignment",
				newValues: {
					teacherId: input.teacherId,
					classId: input.classId,
					paymentAmount: input.paymentAmount,
					paymentCycle: input.paymentCycle,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	getClassesByCourse: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return teacherService.getTeacherClassesByCourse(input);
		}),

	removeFromClass: protectedProcedure
		.input(
			z.object({
				teacherId: z.string().uuid(),
				classId: z.string().uuid(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await teacherService.removeFromClass(
				input.teacherId,
				input.classId,
			);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "remove_teacher_from_class",
				entityType: "class_teacher_assignment",
				newValues: {
					teacherId: input.teacherId,
					classId: input.classId,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	updateClassAssignment: protectedProcedure
		.input(
			z.object({
				teacherId: z.string().uuid(),
				classId: z.string().uuid(),
				paymentAmount: z.number().positive().optional(),
				paymentCycle: z.enum(["4", "8"]).optional(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (
				input.paymentAmount === undefined &&
				input.paymentCycle === undefined
			) {
				throw new Error("No changes provided");
			}

			const result = await teacherService.updateClassAssignment(
				input.teacherId,
				input.classId,
				{
					paymentAmount: input.paymentAmount,
					paymentCycle: input.paymentCycle,
				},
			);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "update_teacher_class_assignment",
				entityType: "class_teacher_assignment",
				newValues: {
					teacherId: input.teacherId,
					classId: input.classId,
					paymentAmount: input.paymentAmount,
					paymentCycle: input.paymentCycle,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	getAvailableClasses: protectedProcedure.query(async () => {
		try {
			// Get all active classes with their relations
			const allClasses = await db.query.classes.findMany({
				where: eq(classes.isActive, true),
				with: {
					course: true,
					level: true,
					schedules: true,
					teacherPayments: true,
				},
			});

			console.log(`Found ${allClasses.length} active classes`);

			// Filter classes without teachers
			const classesWithoutTeachers = allClasses.filter(
				(cls) => !cls.teacherPayments || cls.teacherPayments.length === 0,
			);

			console.log(
				`Found ${classesWithoutTeachers.length} classes without teachers`,
			);

			// Group by course
			const coursesMap = new Map();

			classesWithoutTeachers.forEach((cls) => {
				const courseId = cls.course?.publicId;
				const courseName = cls.course?.name;

				if (!courseId || !courseName) {
					console.log("Skipping class without course:", cls.id);
					return;
				}

				if (!coursesMap.has(courseId)) {
					coursesMap.set(courseId, {
						id: courseId,
						name: courseName,
						classes: [],
					});
				}

				coursesMap.get(courseId).classes.push({
					id: cls.publicId,
					name: cls.name,
					levelNumber: cls.level?.levelNumber || 0,
					schedules:
						cls.schedules
							?.filter((s) => s.isActive)
							.map((s) => ({
								dayOfWeek: s.dayOfWeek,
								startTime: s.startTime,
								endTime: s.endTime,
							})) || [],
				});
			});

			const result = {
				courses: Array.from(coursesMap.values()),
			};

			console.log(
				`Returning ${result.courses.length} courses with available classes`,
			);
			return result;
		} catch (error) {
			console.error("Error in getAvailableClasses:", error);
			throw error;
		}
	}),
});
