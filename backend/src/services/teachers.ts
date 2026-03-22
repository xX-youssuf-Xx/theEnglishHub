import { and, count, desc, eq, or } from "drizzle-orm";
import { db } from "../db";
import {
	classes,
	classTeacherPayments,
	teacherPayments,
	teachers,
} from "../db/schema";
import { logger } from "../utils/logger";
import { buildLooseFuzzyCondition } from "../utils/search";

export class TeacherService {
	async getAll(params: { page?: number; limit?: number; search?: string }) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			let whereClause = eq(teachers.isActive, true);

			if (params.search) {
				const nameMatch = buildLooseFuzzyCondition(
					teachers.fullName,
					params.search,
				);
				const phoneMatch = buildLooseFuzzyCondition(
					teachers.phone,
					params.search,
				);

				whereClause = and(whereClause, or(nameMatch, phoneMatch)) as any;
			}

			const [data, totalResult] = await Promise.all([
				db.query.teachers.findMany({
					where: whereClause,
					with: {
						classPayments: {
							where: eq(classTeacherPayments.isActive, true),
							with: {
								class: true,
							},
						},
					},
					limit,
					offset,
					orderBy: desc(teachers.createdAt),
				}),
				db.select({ count: count() }).from(teachers).where(whereClause),
			]);

			const total = totalResult[0]?.count || 0;

			return {
				data: data.map((t) => ({
					id: t.publicId,
					fullName: t.fullName,
					phone: t.phone,
					email: t.email,
					address: t.address,
					classes: t.classPayments?.map((cp) => ({
						id: cp.class.publicId,
						name: cp.class.name,
						paymentAmount: cp.paymentAmount,
						paymentCycle: cp.paymentCycle,
					})),
					isActive: t.isActive,
					createdAt: t.createdAt,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get all teachers error:", error);
			throw error;
		}
	}

	async getById(publicId: string) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, publicId),
				with: {
					classPayments: {
						where: eq(classTeacherPayments.isActive, true),
						with: {
							class: {
								with: {
									sessions: true,
								},
							},
						},
					},
					payments: {
						orderBy: desc(teacherPayments.paymentDate),
					},
				},
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			// Calculate upcoming payments
			const upcomingPayments = teacher.classPayments?.map((cp) => {
				const completedSessions =
					cp.class.sessions?.filter((s) => s.status === "completed").length ||
					0;
				const cycleSize = parseInt(cp.paymentCycle, 10);
				const cyclesCompleted = Math.floor(completedSessions / cycleSize);
				const sessionsInCurrentCycle = completedSessions % cycleSize;
				const totalEarned = cyclesCompleted * parseFloat(cp.paymentAmount);

				const paidAmount =
					teacher.payments
						?.filter((p) => p.classId === cp.class.id)
						.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

				return {
					classId: cp.class.publicId,
					className: cp.class.name,
					paymentAmount: cp.paymentAmount,
					paymentCycle: cp.paymentCycle,
					sessionsCompleted: completedSessions,
					sessionsInCurrentCycle,
					cyclesCompleted,
					totalEarned,
					totalPaid: paidAmount,
					balanceDue: totalEarned - paidAmount,
					sessionsUntilNextPayment: cycleSize - sessionsInCurrentCycle,
				};
			});

			return {
				id: teacher.publicId,
				fullName: teacher.fullName,
				phone: teacher.phone,
				email: teacher.email,
				address: teacher.address,
				classes: teacher.classPayments?.map((cp) => ({
					id: cp.class.publicId,
					name: cp.class.name,
					paymentAmount: cp.paymentAmount,
					paymentCycle: cp.paymentCycle,
				})),
				payments: teacher.payments?.map((p) => ({
					id: p.publicId,
					amount: p.amount,
					sessionsCovered: p.sessionsCovered,
					paymentDate: p.paymentDate,
				})),
				upcomingPayments,
				isActive: teacher.isActive,
				createdAt: teacher.createdAt,
				updatedAt: teacher.updatedAt,
			};
		} catch (error) {
			logger.error("Get teacher by id error:", error);
			throw error;
		}
	}

	async create(data: {
		fullName: string;
		phone?: string;
		email?: string;
		address?: string;
		classAssignments?: {
			classId: number;
			paymentAmount: number;
			paymentCycle: "4" | "8";
		}[];
	}) {
		try {
			const [teacher] = await db
				.insert(teachers)
				.values({
					fullName: data.fullName,
					phone: data.phone || null,
					email: data.email || null,
					address: data.address || null,
				})
				.returning();

			// Create class assignments if provided
			if (data.classAssignments && data.classAssignments.length > 0) {
				await db.insert(classTeacherPayments).values(
					data.classAssignments.map((ca) => ({
						teacherId: teacher.id,
						classId: ca.classId,
						paymentAmount: ca.paymentAmount.toString(),
						paymentCycle: ca.paymentCycle,
					})),
				);
			}

			return {
				id: teacher.publicId,
				fullName: teacher.fullName,
				message: "Teacher created successfully",
			};
		} catch (error) {
			logger.error("Create teacher error:", error);
			throw error;
		}
	}

	async update(
		publicId: string,
		data: Partial<{
			fullName: string;
			phone: string;
			email: string;
			address: string;
		}>,
	) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, publicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			const [updated] = await db
				.update(teachers)
				.set({
					...data,
					updatedAt: new Date(),
				})
				.where(eq(teachers.id, teacher.id))
				.returning();

			return {
				id: updated.publicId,
				fullName: updated.fullName,
				message: "Teacher updated successfully",
			};
		} catch (error) {
			logger.error("Update teacher error:", error);
			throw error;
		}
	}

	async delete(publicId: string) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, publicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			await db
				.update(teachers)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(teachers.id, teacher.id));

			return { message: "Teacher deleted successfully" };
		} catch (error) {
			logger.error("Delete teacher error:", error);
			throw error;
		}
	}

	async assignToClass(
		teacherPublicId: string,
		data: {
			classId: number;
			paymentAmount: number;
			paymentCycle: "4" | "8";
		},
	) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, teacherPublicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			// Start a transaction to ensure both operations succeed or fail together
			await db.transaction(async (tx) => {
				// Insert into classTeacherPayments
				await tx.insert(classTeacherPayments).values({
					teacherId: teacher.id,
					classId: data.classId,
					paymentAmount: data.paymentAmount.toString(),
					paymentCycle: data.paymentCycle,
				});

				// Also update the class's teacherId
				await tx
					.update(classes)
					.set({ teacherId: teacher.id, updatedAt: new Date() })
					.where(eq(classes.id, data.classId));
			});

			return { message: "Teacher assigned to class successfully" };
		} catch (error) {
			logger.error("Assign teacher to class error:", error);
			throw error;
		}
	}

	async getTeacherClassesByCourse(teacherPublicId: string) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, teacherPublicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			// Get all active class assignments for this teacher
			const classAssignments = await db.query.classTeacherPayments.findMany({
				where: and(
					eq(classTeacherPayments.teacherId, teacher.id),
					eq(classTeacherPayments.isActive, true),
				),
				with: {
					class: {
						with: {
							course: true,
							level: true,
							schedules: true,
						},
					},
				},
			});

			// Group by course
			const coursesMap = new Map();

			classAssignments.forEach((assignment) => {
				const courseId = assignment.class.course.publicId;
				const courseName = assignment.class.course.name;

				if (!coursesMap.has(courseId)) {
					coursesMap.set(courseId, {
						id: courseId,
						name: courseName,
						classes: [],
					});
				}

				coursesMap.get(courseId).classes.push({
					id: assignment.class.publicId,
					name: assignment.class.name,
					levelNumber: assignment.class.level.levelNumber,
					paymentAmount: assignment.paymentAmount,
					paymentCycle: assignment.paymentCycle,
					schedules:
						assignment.class.schedules
							?.filter((s) => s.isActive)
							.map((s) => ({
								dayOfWeek: s.dayOfWeek,
								startTime: s.startTime,
								endTime: s.endTime,
							})) || [],
				});
			});

			return {
				teacherId: teacher.publicId,
				teacherName: teacher.fullName,
				courses: Array.from(coursesMap.values()),
			};
		} catch (error) {
			logger.error("Get teacher classes by course error:", error);
			throw error;
		}
	}

	async removeFromClass(teacherPublicId: string, classPublicId: string) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, teacherPublicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			// Start a transaction to ensure both operations succeed or fail together
			await db.transaction(async (tx) => {
				// Delete from classTeacherPayments
				await tx
					.delete(classTeacherPayments)
					.where(
						and(
							eq(classTeacherPayments.teacherId, teacher.id),
							eq(classTeacherPayments.classId, classData.id),
						),
					);

				// Also clear the class's teacherId
				await tx
					.update(classes)
					.set({ teacherId: null, updatedAt: new Date() })
					.where(eq(classes.id, classData.id));
			});

			return { message: "Teacher removed from class successfully" };
		} catch (error) {
			logger.error("Remove teacher from class error:", error);
			throw error;
		}
	}

	async updateClassAssignment(
		teacherPublicId: string,
		classPublicId: string,
		data: {
			paymentAmount?: number;
			paymentCycle?: "4" | "8";
		},
	) {
		try {
			const teacher = await db.query.teachers.findFirst({
				where: eq(teachers.publicId, teacherPublicId),
			});

			if (!teacher) {
				throw new Error("Teacher not found");
			}

			const classData = await db.query.classes.findFirst({
				where: eq(classes.publicId, classPublicId),
			});

			if (!classData) {
				throw new Error("Class not found");
			}

			const assignment = await db.query.classTeacherPayments.findFirst({
				where: and(
					eq(classTeacherPayments.teacherId, teacher.id),
					eq(classTeacherPayments.classId, classData.id),
					eq(classTeacherPayments.isActive, true),
				),
			});

			if (!assignment) {
				throw new Error("Class assignment not found");
			}

			await db
				.update(classTeacherPayments)
				.set({
					paymentAmount:
						data.paymentAmount !== undefined
							? data.paymentAmount.toString()
							: assignment.paymentAmount,
					paymentCycle: data.paymentCycle ?? assignment.paymentCycle,
					updatedAt: new Date(),
				})
				.where(eq(classTeacherPayments.id, assignment.id));

			return { message: "Class assignment updated successfully" };
		} catch (error) {
			logger.error("Update class assignment error:", error);
			throw error;
		}
	}
}

export const teacherService = new TeacherService();
