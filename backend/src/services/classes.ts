import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
	classes,
	classTeacherPayments,
	sessions,
	students,
} from "../db/schema";
import { logger } from "../utils/logger";

export class ClassService {
	async getAll(params: { page?: number; limit?: number; teacherId?: number }) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			let whereClause = eq(classes.isActive, true);

			if (params.teacherId) {
				whereClause = and(
					whereClause,
					eq(classes.teacherId, params.teacherId),
				) as any;
			}

			const [data, totalResult] = await Promise.all([
				db.query.classes.findMany({
					where: whereClause,
					with: {
						teacher: true,
						teacherPayments: true,
						students: {
							where: eq(students.isActive, true),
						},
						sessions: {
							orderBy: desc(sessions.sessionDate),
							limit: 10,
						},
					},
					limit,
					offset,
					orderBy: desc(classes.createdAt),
				}),
				db.select({ count: count() }).from(classes).where(whereClause),
			]);

			const total = totalResult[0]?.count || 0;

			return {
				data: data.map((c) => ({
					id: c.publicId,
					name: c.name,
					teacher: c.teacher
						? {
								id: c.teacher.publicId,
								fullName: c.teacher.fullName,
							}
						: null,
					schedule: {
						dayOfWeek: c.scheduleDayOfWeek,
						startTime: c.scheduleStartTime,
						endTime: c.scheduleEndTime,
					},
					startDate: c.startDate,
					studentCount: c.students?.length || 0,
					teacherPayment: c.teacherPayments?.[0]
						? {
								amount: c.teacherPayments[0].paymentAmount,
								cycle: c.teacherPayments[0].paymentCycle,
							}
						: null,
					recentSessions: c.sessions?.map((s) => ({
						id: s.publicId,
						date: s.sessionDate,
						completed: s.completed,
					})),
					isActive: c.isActive,
					createdAt: c.createdAt,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get all classes error:", error);
			throw error;
		}
	}

	async getById(publicId: string) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
				with: {
					teacher: true,
					teacherPayments: {
						with: {
							teacher: true,
						},
					},
					students: {
						where: eq(students.isActive, true),
						with: {
							enrollments: {
								with: {
									course: true,
								},
							},
						},
					},
					sessions: {
						orderBy: desc(sessions.sessionDate),
					},
				},
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const completedSessions =
				classData.sessions?.filter((s) => s.completed).length || 0;

			return {
				id: classData.publicId,
				name: classData.name,
				teacher: classData.teacher
					? {
							id: classData.teacher.publicId,
							fullName: classData.teacher.fullName,
							phone: classData.teacher.phone,
							email: classData.teacher.email,
						}
					: null,
				schedule: {
					dayOfWeek: classData.scheduleDayOfWeek,
					startTime: classData.scheduleStartTime,
					endTime: classData.scheduleEndTime,
				},
				startDate: classData.startDate,
				teacherPayment: classData.teacherPayments?.[0]
					? {
							amount: classData.teacherPayments[0].paymentAmount,
							cycle: classData.teacherPayments[0].paymentCycle,
							teacher: {
								id: classData.teacherPayments[0].teacher.publicId,
								fullName: classData.teacherPayments[0].teacher.fullName,
							},
						}
					: null,
				students: classData.students?.map((s) => ({
					id: s.publicId,
					fullName: s.fullName,
					parentName: s.parentName,
					parentPhone: s.parentPhone,
					enrollments: s.enrollments?.map((e) => ({
						id: e.publicId,
						course: { id: e.course.publicId, name: e.course.name },
					})),
				})),
				sessions: classData.sessions?.map((s) => ({
					id: s.publicId,
					date: s.sessionDate,
					startTime: s.startTime,
					endTime: s.endTime,
					completed: s.completed,
					notes: s.notes,
				})),
				sessionStats: {
					total: classData.sessions?.length || 0,
					completed: completedSessions,
				},
				isActive: classData.isActive,
				createdAt: classData.createdAt,
				updatedAt: classData.updatedAt,
			};
		} catch (error) {
			logger.error("Get class by id error:", error);
			throw error;
		}
	}

	async create(data: {
		name: string;
		teacherId?: number;
		scheduleDayOfWeek?: number;
		scheduleStartTime?: string;
		scheduleEndTime?: string;
		startDate?: Date;
		teacherPayment?: {
			paymentAmount: number;
			paymentCycle: "4" | "8";
		};
		studentIds?: number[];
	}) {
		try {
			const [classData] = await db
				.insert(classes)
				.values({
					name: data.name,
					teacherId: data.teacherId || null,
					scheduleDayOfWeek: data.scheduleDayOfWeek || null,
					scheduleStartTime: data.scheduleStartTime || null,
					scheduleEndTime: data.scheduleEndTime || null,
					startDate: data.startDate
						? data.startDate.toISOString().split("T")[0]
						: null,
				})
				.returning();

			// Create teacher payment config if provided
			if (data.teacherPayment && data.teacherId) {
				await db.insert(classTeacherPayments).values({
					classId: classData.id,
					teacherId: data.teacherId,
					paymentAmount: data.teacherPayment.paymentAmount.toString(),
					paymentCycle: data.teacherPayment.paymentCycle,
				});
			}

			// Enroll students if provided
			if (data.studentIds && data.studentIds.length > 0) {
				await db
					.update(students)
					.set({ classId: classData.id })
					.where(
						and(
							inArray(students.id, data.studentIds),
							eq(students.isActive, true),
						),
					);
			}

			return {
				id: classData.publicId,
				name: classData.name,
				message: "Class created successfully",
			};
		} catch (error) {
			logger.error("Create class error:", error);
			throw error;
		}
	}

	async update(
		publicId: string,
		data: Partial<{
			name: string;
			teacherId: number;
			scheduleDayOfWeek: number;
			scheduleStartTime: string;
			scheduleEndTime: string;
			startDate: Date;
		}>,
	) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			// Convert startDate to string if provided
			const updateData: any = {
				...data,
				updatedAt: new Date(),
			};

			if (data.startDate) {
				updateData.startDate = data.startDate.toISOString().split("T")[0];
			}

			const [updated] = await db
				.update(classes)
				.set(updateData)
				.where(eq(classes.id, classData.id))
				.returning();

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

	async delete(publicId: string) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			// Delete all sessions associated with this class
			await db.delete(sessions).where(eq(sessions.classId, classData.id));

			await db
				.update(classes)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(classes.id, classData.id));

			return { message: "Class deleted successfully" };
		} catch (error) {
			logger.error("Delete class error:", error);
			throw error;
		}
	}

	async enrollStudents(classPublicId: string, studentIds: number[]) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			await db
				.update(students)
				.set({ classId: classData.id })
				.where(
					and(inArray(students.id, studentIds), eq(students.isActive, true)),
				);

			return { message: "Students enrolled successfully" };
		} catch (error) {
			logger.error("Enroll students error:", error);
			throw error;
		}
	}

	async removeStudent(classPublicId: string, studentPublicId: string) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const student = await db.query.students.findFirst({
				where: eq(students.publicId, studentPublicId),
			});

			if (!student) {
				throw new Error("Student not found");
			}

			await db
				.update(students)
				.set({ classId: null })
				.where(eq(students.id, student.id));

			return { message: "Student removed from class successfully" };
		} catch (error) {
			logger.error("Remove student error:", error);
			throw error;
		}
	}

	async createSession(
		classPublicId: string,
		data: {
			sessionDate: Date;
			startTime?: string;
			endTime?: string;
			notes?: string;
		},
	) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const [session] = await db
				.insert(sessions)
				.values({
					classId: classData.id,
					sessionDate: data.sessionDate.toISOString().split("T")[0],
					startTime: data.startTime || null,
					endTime: data.endTime || null,
					notes: data.notes || null,
				})
				.returning();

			return {
				id: session.publicId,
				sessionDate: session.sessionDate,
				message: "Session created successfully",
			};
		} catch (error) {
			logger.error("Create session error:", error);
			throw error;
		}
	}

	async markSessionComplete(sessionPublicId: string, completed: boolean) {
		try {
			const session = await db.query.sessions.findFirst({
				where: eq(sessions.publicId, sessionPublicId),
			});

			if (!session) {
				throw new Error("Session not found");
			}

			const [updated] = await db
				.update(sessions)
				.set({ completed, updatedAt: new Date() })
				.where(eq(sessions.id, session.id))
				.returning();

			return {
				id: updated.publicId,
				completed: updated.completed,
				message: `Session marked as ${completed ? "completed" : "incomplete"}`,
			};
		} catch (error) {
			logger.error("Mark session complete error:", error);
			throw error;
		}
	}

	async updateClass(
		publicId: string,
		data: {
			name?: string;
			teacherId?: number;
			levelId?: number;
			isActive?: boolean;
		},
	) {
		try {
			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, publicId),
			});

			if (!classData) {
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
				.where(eq(classes.id, classData.id))
				.returning();

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
}

export const classService = new ClassService();
