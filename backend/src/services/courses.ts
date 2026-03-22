import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
	books,
	classes,
	classSchedules,
	classTeacherPayments,
	courseLevels,
	coursePrerequisites,
	courses,
	levelPrerequisites,
	sessions,
	studentEnrollments,
} from "../db/schema";
import { logger } from "../utils/logger";

export class CourseService {
	async getAll() {
		try {
			const data = await db.query.courses.findMany({
				where: eq(courses.isActive, true),
				with: {
					levels: {
						with: {
							books: true,
						},
						orderBy: courseLevels.levelNumber,
					},
					enrollments: {
						where: eq(studentEnrollments.status, "active"),
					},
				},
				orderBy: desc(courses.createdAt),
			});

			return {
				data: data.map((c) => ({
					id: c.publicId,
					name: c.name,
					description: c.description,
					syllabus: c.syllabus,
					sessionsPerMonth: c.sessionsPerMonth,
					levelsCount: c.levels?.length || 0,
					enrollmentCount: c.enrollments?.length || 0,
					levels: c.levels?.map((l) => ({
						id: l.publicId,
						levelNumber: l.levelNumber,
						durationMonths: l.durationMonths,
						pricePerMonth: l.pricePerMonth,
						description: l.description,
						books: l.books?.map((b) => ({
							id: b.publicId,
							name: b.name,
							price: b.price,
						})),
					})),
					isActive: c.isActive,
					createdAt: c.createdAt,
				})),
			};
		} catch (error) {
			logger.error("Get all courses error:", error);
			throw error;
		}
	}

	async getById(publicId: string) {
		try {
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, publicId),
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
						orderBy: courseLevels.levelNumber,
					},
					enrollments: {
						with: {
							student: true,
						},
					},
					prerequisites: {
						with: {
							prerequisiteCourse: true,
						},
					},
					classes: {
						where: eq(classes.isActive, true),
					},
				},
			});

			if (!course) {
				throw new Error("Course not found");
			}

			return {
				id: course.publicId,
				name: course.name,
				description: course.description,
				syllabus: course.syllabus,
				sessionsPerMonth: course.sessionsPerMonth,
				levels: course.levels?.map((l) => ({
					id: l.publicId,
					levelNumber: l.levelNumber,
					durationMonths: l.durationMonths,
					pricePerMonth: l.pricePerMonth,
					description: l.description,
					books: l.books?.map((b) => ({
						id: b.publicId,
						name: b.name,
						price: b.price,
					})),
					prerequisites: l.prerequisites?.map((p) => ({
						id: p.prerequisiteLevel.publicId,
						levelNumber: p.prerequisiteLevel.levelNumber,
					})),
				})),
				prerequisites:
					course.prerequisites?.map((p) => ({
						id: p.prerequisiteCourse.publicId,
						name: p.prerequisiteCourse.name,
					})) || [],
				enrollmentCount: course.enrollments?.length || 0,
				classesCount: course.classes?.length || 0,
				isActive: course.isActive,
				createdAt: course.createdAt,
				updatedAt: course.updatedAt,
			};
		} catch (error) {
			logger.error("Get course by id error:", error);
			throw error;
		}
	}

	async create(data: {
		name: string;
		description?: string;
		syllabus?: string;
		sessionsPerMonth?: number;
	}) {
		try {
			const [course] = await db
				.insert(courses)
				.values({
					name: data.name,
					description: data.description || null,
					syllabus: data.syllabus || null,
					sessionsPerMonth: data.sessionsPerMonth || 4,
				})
				.returning();

			return {
				id: course.publicId,
				name: course.name,
				message: "Course created successfully",
			};
		} catch (error) {
			logger.error("Create course error:", error);
			throw error;
		}
	}

	async update(
		publicId: string,
		data: Partial<{
			name: string;
			description: string;
			syllabus: string;
			sessionsPerMonth: number;
		}>,
	) {
		try {
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, publicId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			const [updated] = await db
				.update(courses)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(courses.id, course.id))
				.returning();

			return {
				id: updated.publicId,
				name: updated.name,
				message: "Course updated successfully",
			};
		} catch (error) {
			logger.error("Update course error:", error);
			throw error;
		}
	}

	async delete(publicId: string) {
		try {
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, publicId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			// Get all classes for this course
			const courseClasses = await db.query.classes.findMany({
				where: eq(classes.courseId, course.id),
			});

			// Delete all sessions for all classes in this course
			if (courseClasses.length > 0) {
				const classIds = courseClasses.map((c) => c.id);
				await db.delete(sessions).where(inArray(sessions.classId, classIds));

				// Soft-delete all classes
				await db
					.update(classes)
					.set({ isActive: false, updatedAt: new Date() })
					.where(inArray(classes.id, classIds));
			}

			// Soft-delete the course
			await db
				.update(courses)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(courses.id, course.id));

			return {
				message: "Course and associated classes/sessions deleted successfully",
			};
		} catch (error) {
			logger.error("Delete course error:", error);
			throw error;
		}
	}

	async addLevel(
		coursePublicId: string,
		data: {
			levelNumber: number;
			durationMonths?: number;
			pricePerMonth?: number;
			description?: string;
			books?: { name: string; price: number }[];
		},
	) {
		try {
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, coursePublicId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			const [level] = await db
				.insert(courseLevels)
				.values({
					courseId: course.id,
					levelNumber: data.levelNumber,
					durationMonths: data.durationMonths || 4,
					pricePerMonth: data.pricePerMonth?.toString() || "0",
					description: data.description || null,
				})
				.returning();

			if (data.books && data.books.length > 0) {
				await db.insert(books).values(
					data.books.map((b) => ({
						levelId: level.id,
						name: b.name,
						price: b.price.toString(),
					})),
				);
			}

			return {
				id: level.publicId,
				levelNumber: level.levelNumber,
				message: "Level added successfully",
			};
		} catch (error) {
			logger.error("Add level error:", error);
			throw error;
		}
	}

	async setPrerequisites(
		levelPublicId: string,
		prerequisiteLevelPublicIds: string[],
	) {
		try {
			const level = await db.query.courseLevels.findFirst({
				where: eq(courseLevels.publicId, levelPublicId),
			});

			if (!level) {
				throw new Error("Level not found");
			}

			// Get prerequisite level IDs
			const prerequisiteLevels = await db.query.courseLevels.findMany({
				where: (levels, { inArray }) =>
					inArray(levels.publicId, prerequisiteLevelPublicIds),
			});

			if (prerequisiteLevels.length !== prerequisiteLevelPublicIds.length) {
				throw new Error("Some prerequisite levels not found");
			}

			// Delete existing prerequisites
			await db
				.delete(levelPrerequisites)
				.where(eq(levelPrerequisites.levelId, level.id));

			// Insert new prerequisites
			if (prerequisiteLevels.length > 0) {
				await db.insert(levelPrerequisites).values(
					prerequisiteLevels.map((pl) => ({
						courseId: level.courseId,
						levelId: level.id,
						prerequisiteLevelId: pl.id,
					})),
				);
			}

			return { message: "Prerequisites updated successfully" };
		} catch (error) {
			logger.error("Set prerequisites error:", error);
			throw error;
		}
	}

	async setCoursePrerequisites(
		coursePublicId: string,
		prerequisiteCoursePublicIds: string[],
	) {
		try {
			const course = await db.query.courses.findFirst({
				where: eq(courses.publicId, coursePublicId),
			});

			if (!course) {
				throw new Error("Course not found");
			}

			// Get prerequisite course IDs
			const prerequisiteCourses = await db.query.courses.findMany({
				where: (c, { inArray }) =>
					inArray(c.publicId, prerequisiteCoursePublicIds),
			});

			if (prerequisiteCourses.length !== prerequisiteCoursePublicIds.length) {
				throw new Error("Some prerequisite courses not found");
			}

			// Delete existing prerequisites
			await db
				.delete(coursePrerequisites)
				.where(eq(coursePrerequisites.courseId, course.id));

			// Insert new prerequisites
			if (prerequisiteCourses.length > 0) {
				await db.insert(coursePrerequisites).values(
					prerequisiteCourses.map((pc) => ({
						courseId: course.id,
						prerequisiteCourseId: pc.id,
					})),
				);
			}

			return { message: "Course prerequisites updated successfully" };
		} catch (error) {
			logger.error("Set course prerequisites error:", error);
			throw error;
		}
	}

	async createClass(data: {
		name: string;
		courseId: number;
		levelId: number;
		teacherId?: number;
		teacherPaymentAmount?: number;
		teacherPaymentCycle?: "4" | "8";
		schedules?: { dayOfWeek: number; startTime: string; endTime: string }[];
	}) {
		try {
			const [newClass] = await db
				.insert(classes)
				.values({
					name: data.name,
					courseId: data.courseId,
					levelId: data.levelId,
					teacherId: data.teacherId || null,
				})
				.returning();

			// Create schedules if provided
			if (data.schedules && data.schedules.length > 0) {
				await db.insert(classSchedules).values(
					data.schedules.map((s) => ({
						classId: newClass.id,
						dayOfWeek: s.dayOfWeek,
						startTime: s.startTime,
						endTime: s.endTime,
					})),
				);
			}

			// Create classTeacherPayments record if teacher is assigned
			if (data.teacherId) {
				const paymentAmount = data.teacherPaymentAmount ?? 0;
				if (paymentAmount <= 0) {
					throw new Error(
						`Teacher payment amount is required and must be greater than 0 when assigning a teacher to class ${newClass.name}.`,
					);
				}

				await db.insert(classTeacherPayments).values({
					classId: newClass.id,
					teacherId: data.teacherId,
					paymentAmount: paymentAmount.toString(),
					paymentCycle: data.teacherPaymentCycle || "4",
					isActive: true,
				});

				logger.info(
					`Created class ${newClass.publicId} with teacher ${data.teacherId}, ` +
						`payment amount: ${paymentAmount}, cycle: ${data.teacherPaymentCycle || "4"}`,
				);
			}

			return {
				id: newClass.publicId,
				name: newClass.name,
				message: "Class created successfully",
			};
		} catch (error) {
			logger.error("Create class error:", error);
			throw error;
		}
	}

	async updateClass(
		publicId: string,
		data: {
			name?: string;
			teacherId?: number;
			levelId?: number;
			teacherPaymentAmount?: number;
			teacherPaymentCycle?: "4" | "8";
			isActive?: boolean;
		},
	) {
		try {
			const cls = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
			});

			if (!cls) {
				throw new Error("Class not found");
			}

			const updateData: any = {
				updatedAt: new Date(),
			};

			if (data.name !== undefined) updateData.name = data.name;
			if (data.teacherId !== undefined) updateData.teacherId = data.teacherId;
			if (data.levelId !== undefined) updateData.levelId = data.levelId;
			if (data.isActive !== undefined) updateData.isActive = data.isActive;

			const [updated] = await db
				.update(classes)
				.set(updateData)
				.where(eq(classes.id, cls.id))
				.returning();

			if (data.teacherId !== undefined) {
				if (data.teacherId && data.teacherPaymentAmount !== undefined) {
					if (data.teacherPaymentAmount <= 0) {
						throw new Error("Teacher payment amount must be greater than 0");
					}

					const existingConfig = await db.query.classTeacherPayments.findFirst({
						where: and(
							eq(classTeacherPayments.classId, cls.id),
							eq(classTeacherPayments.teacherId, data.teacherId),
						),
					});

					if (existingConfig) {
						await db
							.update(classTeacherPayments)
							.set({
								paymentAmount: data.teacherPaymentAmount.toString(),
								paymentCycle: data.teacherPaymentCycle || "4",
								isActive: true,
								updatedAt: new Date(),
							})
							.where(eq(classTeacherPayments.id, existingConfig.id));
					} else {
						await db.insert(classTeacherPayments).values({
							classId: cls.id,
							teacherId: data.teacherId,
							paymentAmount: data.teacherPaymentAmount.toString(),
							paymentCycle: data.teacherPaymentCycle || "4",
							isActive: true,
						});
					}
				}
			}

			return {
				id: updated.publicId,
				name: updated.name,
				message: "Class updated successfully",
			};
		} catch (error) {
			logger.error("Update class error:", error);
			throw error;
		}
	}

	async deleteClass(publicId: string) {
		try {
			const cls = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
			});

			if (!cls) {
				throw new Error("Class not found");
			}

			// Delete all sessions associated with this class
			await db.delete(sessions).where(eq(sessions.classId, cls.id));

			await db
				.update(classes)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(classes.id, cls.id));

			return { message: "Class and associated sessions deleted successfully" };
		} catch (error) {
			logger.error("Delete class error:", error);
			throw error;
		}
	}
}

export const courseService = new CourseService();
