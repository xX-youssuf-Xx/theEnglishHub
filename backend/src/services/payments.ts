import { and, count, desc, eq, gte, lte, or, sql, sum } from "drizzle-orm";
import { db } from "../db";
import {
	classes,
	classTeacherPayments,
	courses,
	expenses,
	sessions,
	studentPayments,
	students,
	teacherPayments,
	teachers,
} from "../db/schema";
import { generateInvoiceNumber } from "../utils/auth";
import { logger } from "../utils/logger";

export class PaymentService {
	// Student Payments
	async getStudentPayments(params: {
		page?: number;
		limit?: number;
		studentId?: number;
		classId?: number;
		type?: "tuition" | "books";
	}) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			let whereClause;

			if (params.studentId) {
				whereClause = eq(studentPayments.studentId, params.studentId);
			}

			if (params.classId) {
				whereClause = whereClause
					? and(whereClause, eq(studentPayments.classId, params.classId))
					: eq(studentPayments.classId, params.classId);
			}

			if (params.type) {
				whereClause = whereClause
					? and(whereClause, eq(studentPayments.paymentType, params.type))
					: eq(studentPayments.paymentType, params.type);
			}

			const [data, totalResult] = await Promise.all([
				db.query.studentPayments.findMany({
					where: whereClause,
					with: {
						student: true,
						class: true,
						course: true,
					},
					limit,
					offset,
					orderBy: desc(studentPayments.paymentDate),
				}),
				db.select({ count: count() }).from(studentPayments).where(whereClause),
			]);

			const total = totalResult[0]?.count || 0;

			return {
				data: data.map((p) => ({
					id: p.publicId,
					student: p.student
						? { id: p.student.publicId, fullName: p.student.fullName }
						: null,
					class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
					course: p.course
						? { id: p.course.publicId, name: p.course.name }
						: null,
					type: p.paymentType,
					amount: p.amount,
					sessionsCovered: p.sessionsCovered,
					paymentDate: p.paymentDate,
					status: p.status,
					invoiceNumber: p.invoiceNumber,
					notes: p.notes,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get student payments error:", error);
			throw error;
		}
	}

	async recordStudentPayment(data: {
		studentId: number;
		classId: number;
		courseId: number;
		type: "tuition" | "books";
		amount: number;
		sessionsCovered?: number;
		paymentDate?: Date;
		notes?: string;
		recordedBy?: number;
	}) {
		try {
			// Validate required associations
			if (!data.classId || !data.courseId) {
				throw new Error("Class ID and Course ID are required for payments");
			}

			// Get next invoice number
			const invoiceResult = await db
				.select({
					maxInvoice: sql`MAX(CAST(SUBSTRING(invoice_number FROM 14) AS INTEGER))`,
				})
				.from(studentPayments);
			const nextSequence = (invoiceResult[0]?.maxInvoice || 0) + 1;
			const invoiceNumber = generateInvoiceNumber(nextSequence);

			const [payment] = await db
				.insert(studentPayments)
				.values({
					studentId: data.studentId,
					classId: data.classId,
					courseId: data.courseId,
					paymentType: data.type,
					amount: data.amount.toString(),
					sessionsCovered: data.sessionsCovered || null,
					paymentDate: data.paymentDate
						? data.paymentDate.toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
					notes: data.notes || null,
					recordedBy: data.recordedBy || null,
					invoiceNumber,
				})
				.returning();

			return {
				id: payment.publicId,
				invoiceNumber: payment.invoiceNumber,
				amount: payment.amount,
				message: "Payment recorded successfully",
			};
		} catch (error) {
			logger.error("Record student payment error:", error);
			throw error;
		}
	}

	// Teacher Payments
	async getTeacherPayments(params: {
		page?: number;
		limit?: number;
		teacherId?: number;
		classId?: number;
	}) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			let whereClause;

			if (params.teacherId) {
				whereClause = eq(teacherPayments.teacherId, params.teacherId);
			}

			if (params.classId) {
				whereClause = whereClause
					? and(whereClause, eq(teacherPayments.classId, params.classId))
					: eq(teacherPayments.classId, params.classId);
			}

			const [data, totalResult] = await Promise.all([
				db.query.teacherPayments.findMany({
					where: whereClause,
					with: {
						teacher: true,
						class: true,
					},
					limit,
					offset,
					orderBy: desc(teacherPayments.paymentDate),
				}),
				db.select({ count: count() }).from(teacherPayments).where(whereClause),
			]);

			const total = totalResult[0]?.count || 0;

			return {
				data: data.map((p) => ({
					id: p.publicId,
					teacher: p.teacher
						? { id: p.teacher.publicId, fullName: p.teacher.fullName }
						: null,
					class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
					amount: p.amount,
					sessionsCovered: p.sessionsCovered,
					paymentDate: p.paymentDate,
					notes: p.notes,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get teacher payments error:", error);
			throw error;
		}
	}

	async recordTeacherPayment(data: {
		teacherId: number;
		classId: number;
		amount: number;
		sessionsCovered: number;
		paymentDate?: Date;
		notes?: string;
		recordedBy?: number;
	}) {
		try {
			const [payment] = await db
				.insert(teacherPayments)
				.values({
					teacherId: data.teacherId,
					classId: data.classId,
					amount: data.amount.toString(),
					sessionsCovered: data.sessionsCovered,
					paymentDate: data.paymentDate
						? data.paymentDate.toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
					notes: data.notes || null,
					recordedBy: data.recordedBy || null,
				})
				.returning();

			return {
				id: payment.publicId,
				amount: payment.amount,
				message: "Teacher payment recorded successfully",
			};
		} catch (error) {
			logger.error("Record teacher payment error:", error);
			throw error;
		}
	}

	// Expenses
	async getExpenses(params: {
		page?: number;
		limit?: number;
		category?: string;
		startDate?: Date;
		endDate?: Date;
	}) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;

			let whereClause;

			if (params.category) {
				whereClause = eq(expenses.category, params.category);
			}

			if (params.startDate) {
				const startDateStr = params.startDate.toISOString().split("T")[0];
				whereClause = whereClause
					? and(whereClause, gte(expenses.expenseDate, startDateStr))
					: gte(expenses.expenseDate, startDateStr);
			}

			if (params.endDate) {
				const endDateStr = params.endDate.toISOString().split("T")[0];
				whereClause = whereClause
					? and(whereClause, lte(expenses.expenseDate, endDateStr))
					: lte(expenses.expenseDate, endDateStr);
			}

			const [data, totalResult] = await Promise.all([
				db.query.expenses.findMany({
					where: whereClause,
					limit,
					offset,
					orderBy: desc(expenses.expenseDate),
				}),
				db.select({ count: count() }).from(expenses).where(whereClause),
			]);

			const total = totalResult[0]?.count || 0;

			return {
				data: data.map((e) => ({
					id: e.publicId,
					category: e.category,
					amount: e.amount,
					expenseDate: e.expenseDate,
					description: e.description,
				})),
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get expenses error:", error);
			throw error;
		}
	}

	async recordExpense(data: {
		category: string;
		amount: number;
		expenseDate?: Date;
		description?: string;
		recordedBy?: number;
	}) {
		try {
			const [expense] = await db
				.insert(expenses)
				.values({
					category: data.category,
					amount: data.amount.toString(),
					expenseDate: data.expenseDate
						? data.expenseDate.toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
					description: data.description || null,
					recordedBy: data.recordedBy || null,
				})
				.returning();

			return {
				id: expense.publicId,
				amount: expense.amount,
				message: "Expense recorded successfully",
			};
		} catch (error) {
			logger.error("Record expense error:", error);
			throw error;
		}
	}

	async deleteExpense(publicId: string) {
		try {
			await db.delete(expenses).where(eq(expenses.publicId, publicId));

			return { message: "Expense deleted successfully" };
		} catch (error) {
			logger.error("Delete expense error:", error);
			throw error;
		}
	}

	// Settle pending student payment
	async settleStudentPayment(data: {
		paymentPublicId: string;
		recordedBy?: number;
		notes?: string;
	}) {
		try {
			const payment = await db.query.studentPayments.findFirst({
				where: eq(studentPayments.publicId, data.paymentPublicId),
				with: {
					student: true,
					class: true,
					course: true,
				},
			});

			if (!payment) {
				throw new Error("Payment not found");
			}

			if (payment.status !== "pending") {
				throw new Error("Payment is not in pending status");
			}

			// Generate invoice number
			const invoiceNumber = await generateInvoiceNumber();

			// Update payment status to paid
			const [updated] = await db
				.update(studentPayments)
				.set({
					status: "paid",
					invoiceNumber,
					recordedBy: data.recordedBy || null,
					notes: data.notes
						? `${payment.notes || ""}\nSettlement: ${data.notes}`.trim()
						: payment.notes,
					updatedAt: new Date(),
				})
				.where(eq(studentPayments.id, payment.id))
				.returning();

			return {
				id: updated.publicId,
				invoiceNumber: updated.invoiceNumber,
				amount: updated.amount,
				student: payment.student?.fullName,
				message: "Payment settled successfully",
			};
		} catch (error) {
			logger.error("Settle student payment error:", error);
			throw error;
		}
	}

	// Settle pending teacher payment
	async settleTeacherPayment(data: {
		paymentPublicId: string;
		recordedBy?: number;
		notes?: string;
	}) {
		try {
			const payment = await db.query.teacherPayments.findFirst({
				where: eq(teacherPayments.publicId, data.paymentPublicId),
				with: {
					teacher: true,
					class: true,
				},
			});

			if (!payment) {
				throw new Error("Payment not found");
			}

			if (payment.status !== "pending") {
				throw new Error("Payment is not in pending status");
			}

			// Update payment status to paid
			const [updated] = await db
				.update(teacherPayments)
				.set({
					status: "paid",
					recordedBy: data.recordedBy || null,
					notes: data.notes
						? `${payment.notes || ""}\nSettlement: ${data.notes}`.trim()
						: payment.notes,
					updatedAt: new Date(),
				})
				.where(eq(teacherPayments.id, payment.id))
				.returning();

			return {
				id: updated.publicId,
				amount: updated.amount,
				teacher: payment.teacher?.fullName,
				class: payment.class?.name,
				message: "Teacher payment settled successfully",
			};
		} catch (error) {
			logger.error("Settle teacher payment error:", error);
			throw error;
		}
	}

	// Get pending student payments (for the payments page)
	async getPendingStudentPayments() {
		try {
			const pendingPayments = await db.query.studentPayments.findMany({
				where: eq(studentPayments.status, "pending"),
				with: {
					student: true,
					class: true,
					course: true,
				},
				orderBy: [desc(studentPayments.createdAt)],
			});

			return {
				data: pendingPayments.map((p) => ({
					id: p.publicId,
					student: p.student
						? { id: p.student.publicId, fullName: p.student.fullName }
						: null,
					class: p.class ? { id: p.class.publicId, name: p.class.name } : null,
					course: p.course
						? { id: p.course.publicId, name: p.course.name }
						: null,
					type: p.paymentType,
					amount: p.amount,
					sessionsCovered: p.sessionsCovered,
					autoGenerated: p.autoGenerated,
					cycleNumber: p.cycleNumber,
					createdAt: p.createdAt,
					notes: p.notes,
				})),
			};
		} catch (error) {
			logger.error("Get pending student payments error:", error);
			throw error;
		}
	}

	// Get pending teacher payments
	async getPendingTeacherPayments() {
		try {
			const pendingPayments = await db.query.teacherPayments.findMany({
				where: eq(teacherPayments.status, "pending"),
				with: {
					teacher: true,
					class: true,
				},
				orderBy: [desc(teacherPayments.createdAt)],
			});

			// Get payment cycle info for each payment
			const paymentsWithCycle = await Promise.all(
				pendingPayments.map(async (p) => {
					const classPayment = await db.query.classTeacherPayments.findFirst({
						where: and(
							eq(classTeacherPayments.classId, p.classId),
							eq(classTeacherPayments.teacherId, p.teacherId),
						),
					});

					return {
						id: p.publicId,
						teacher: p.teacher
							? { id: p.teacher.publicId, fullName: p.teacher.fullName }
							: null,
						class: p.class
							? { id: p.class.publicId, name: p.class.name }
							: null,
						amount: p.amount,
						sessionsCovered: p.sessionsCovered,
						autoGenerated: p.autoGenerated,
						cycleNumber: p.cycleNumber,
						paymentCycle: classPayment?.paymentCycle || "4",
						status: p.status,
						createdAt: p.createdAt,
						notes: p.notes,
					};
				}),
			);

			return {
				data: paymentsWithCycle,
			};
		} catch (error) {
			logger.error("Get pending teacher payments error:", error);
			throw error;
		}
	}

	// Unified payment history with filtering
	async getPaymentHistory(params: {
		page?: number;
		limit?: number;
		type?: "student" | "teacher" | "expense" | "all";
		startDate?: Date;
		endDate?: Date;
	}) {
		try {
			const page = params.page || 1;
			const limit = params.limit || 20;
			const offset = (page - 1) * limit;
			const type = params.type || "all";

			const startDateStr = params.startDate?.toISOString().split("T")[0];
			const endDateStr = params.endDate?.toISOString().split("T")[0];

			const allPayments: any[] = [];

			// Get student payments
			if (type === "all" || type === "student") {
				let studentWhere;
				if (startDateStr) {
					studentWhere = gte(studentPayments.paymentDate, startDateStr);
				}
				if (endDateStr) {
					studentWhere = studentWhere
						? and(studentWhere, lte(studentPayments.paymentDate, endDateStr))
						: lte(studentPayments.paymentDate, endDateStr);
				}

				const studentData = await db.query.studentPayments.findMany({
					where: studentWhere,
					with: {
						student: true,
						class: true,
						course: true,
					},
					orderBy: desc(studentPayments.paymentDate),
				});

				allPayments.push(
					...studentData.map((p) => ({
						id: p.publicId,
						type: "student" as const,
						subType: p.paymentType,
						date: p.paymentDate,
						amount: p.amount,
						status: p.status,
						person: p.student
							? { id: p.student.publicId, name: p.student.fullName }
							: null,
						class: p.class
							? { id: p.class.publicId, name: p.class.name }
							: null,
						course: p.course
							? { id: p.course.publicId, name: p.course.name }
							: null,
						sessionsCovered: p.sessionsCovered,
						invoiceNumber: p.invoiceNumber,
						autoGenerated: p.autoGenerated,
						cycleNumber: p.cycleNumber,
						notes: p.notes,
						createdAt: p.createdAt,
					})),
				);
			}

			// Get teacher payments
			if (type === "all" || type === "teacher") {
				let teacherWhere;
				if (startDateStr) {
					teacherWhere = gte(teacherPayments.paymentDate, startDateStr);
				}
				if (endDateStr) {
					teacherWhere = teacherWhere
						? and(teacherWhere, lte(teacherPayments.paymentDate, endDateStr))
						: lte(teacherPayments.paymentDate, endDateStr);
				}

				const teacherData = await db.query.teacherPayments.findMany({
					where: teacherWhere,
					with: {
						teacher: true,
						class: true,
					},
					orderBy: desc(teacherPayments.paymentDate),
				});

				// Get payment cycle for each
				const teacherPaymentsWithCycle = await Promise.all(
					teacherData.map(async (p) => {
						const classPayment = await db.query.classTeacherPayments.findFirst({
							where: and(
								eq(classTeacherPayments.classId, p.classId),
								eq(classTeacherPayments.teacherId, p.teacherId),
							),
						});

						return {
							id: p.publicId,
							type: "teacher" as const,
							subType: "salary",
							date: p.paymentDate,
							amount: p.amount,
							status: p.status,
							person: p.teacher
								? { id: p.teacher.publicId, name: p.teacher.fullName }
								: null,
							class: p.class
								? { id: p.class.publicId, name: p.class.name }
								: null,
							course: null,
							sessionsCovered: p.sessionsCovered,
							invoiceNumber: null,
							autoGenerated: p.autoGenerated,
							cycleNumber: p.cycleNumber,
							paymentCycle: classPayment?.paymentCycle || "4",
							notes: p.notes,
							createdAt: p.createdAt,
						};
					}),
				);

				allPayments.push(...teacherPaymentsWithCycle);
			}

			// Get expenses
			if (type === "all" || type === "expense") {
				let expenseWhere;
				if (startDateStr) {
					expenseWhere = gte(expenses.expenseDate, startDateStr);
				}
				if (endDateStr) {
					expenseWhere = expenseWhere
						? and(expenseWhere, lte(expenses.expenseDate, endDateStr))
						: lte(expenses.expenseDate, endDateStr);
				}

				const expenseData = await db.query.expenses.findMany({
					where: expenseWhere,
					orderBy: desc(expenses.expenseDate),
				});

				allPayments.push(
					...expenseData.map((e) => ({
						id: e.publicId,
						type: "expense" as const,
						subType: e.category,
						date: e.expenseDate,
						amount: e.amount,
						status: "paid",
						person: null,
						class: null,
						course: null,
						sessionsCovered: null,
						invoiceNumber: null,
						autoGenerated: false,
						cycleNumber: null,
						notes: e.description,
						createdAt: e.createdAt,
					})),
				);
			}

			// Sort all payments by date
			allPayments.sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			);

			const total = allPayments.length;
			const paginatedPayments = allPayments.slice(offset, offset + limit);

			return {
				data: paginatedPayments,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			logger.error("Get payment history error:", error);
			throw error;
		}
	}

	// Get pending teacher payments grouped by teacher
	async getPendingPaymentsByTeacher() {
		try {
			const pendingPayments = await db.query.teacherPayments.findMany({
				where: eq(teacherPayments.status, "pending"),
				with: {
					teacher: true,
					class: true,
				},
				orderBy: [desc(teacherPayments.createdAt)],
			});

			// Group payments by teacher
			const groupedByTeacher = new Map();

			for (const payment of pendingPayments) {
				const teacherId = payment.teacher?.publicId;
				if (!teacherId) continue;

				if (!groupedByTeacher.has(teacherId)) {
					groupedByTeacher.set(teacherId, {
						teacher: payment.teacher
							? {
									id: payment.teacher.publicId,
									name: payment.teacher.fullName,
								}
							: null,
						count: 0,
						paymentCount: 0,
						totalAmount: 0,
						payments: [],
					});
				}

				const group = groupedByTeacher.get(teacherId);
				group.count += 1;
				group.paymentCount += 1;
				group.totalAmount += parseFloat(payment.amount.toString());

				const classPaymentConfig =
					payment.classId && payment.teacherId
						? await db.query.classTeacherPayments.findFirst({
								where: and(
									eq(classTeacherPayments.classId, payment.classId),
									eq(classTeacherPayments.teacherId, payment.teacherId),
								),
							})
						: null;

				group.payments.push({
					id: payment.publicId,
					amount: payment.amount,
					class: payment.class
						? { id: payment.class.publicId, name: payment.class.name }
						: null,
					sessionsCovered: payment.sessionsCovered,
					autoGenerated: payment.autoGenerated,
					cycleNumber: payment.cycleNumber,
					paymentCycle: classPaymentConfig?.paymentCycle || "4",
					createdAt: payment.createdAt,
					notes: payment.notes,
				});
			}

			return {
				data: Array.from(groupedByTeacher.values()).map((group) => ({
					...group,
					totalAmount: parseFloat(group.totalAmount.toFixed(2)),
				})),
			};
		} catch (error) {
			logger.error("Get pending payments by teacher error:", error);
			throw error;
		}
	}

	// Get pending student payments grouped by course
	async getPendingPaymentsByCourse() {
		try {
			const pendingPayments = await db.query.studentPayments.findMany({
				where: eq(studentPayments.status, "pending"),
				with: {
					student: true,
					class: true,
					course: true,
				},
				orderBy: [desc(studentPayments.createdAt)],
			});

			// Group payments by course
			const groupedByCourse = new Map();

			for (const payment of pendingPayments) {
				const courseId = payment.course?.publicId;
				if (!courseId) continue;

				if (!groupedByCourse.has(courseId)) {
					groupedByCourse.set(courseId, {
						course: payment.course
							? {
									id: payment.course.publicId,
									name: payment.course.name,
								}
							: null,
						count: 0,
						paymentCount: 0,
						studentCount: 0,
						totalAmount: 0,
						studentIds: new Set<string>(),
						payments: [],
					});
				}

				const group = groupedByCourse.get(courseId);
				group.count += 1;
				group.paymentCount += 1;
				group.totalAmount += parseFloat(payment.amount.toString());
				if (payment.student?.publicId) {
					group.studentIds.add(payment.student.publicId);
					group.studentCount = group.studentIds.size;
				}
				group.payments.push({
					id: payment.publicId,
					student: payment.student
						? {
								id: payment.student.publicId,
								fullName: payment.student.fullName,
							}
						: null,
					class: payment.class
						? { id: payment.class.publicId, name: payment.class.name }
						: null,
					type: payment.paymentType,
					amount: payment.amount,
					sessionsCovered: payment.sessionsCovered,
					autoGenerated: payment.autoGenerated,
					cycleNumber: payment.cycleNumber,
					createdAt: payment.createdAt,
					notes: payment.notes,
				});
			}

			return {
				data: Array.from(groupedByCourse.values()).map((group) => ({
					course: group.course,
					count: group.count,
					paymentCount: group.paymentCount,
					studentCount: group.studentCount,
					totalAmount: parseFloat(group.totalAmount.toFixed(2)),
					payments: group.payments,
				})),
			};
		} catch (error) {
			logger.error("Get pending payments by course error:", error);
			throw error;
		}
	}

	// Bulk settle all pending payments for a specific teacher
	async bulkSettleTeacherPayments(data: {
		teacherId: number;
		recordedBy?: number;
		notes?: string;
	}) {
		try {
			// Get all pending payments for this teacher
			const pendingPayments = await db.query.teacherPayments.findMany({
				where: and(
					eq(teacherPayments.teacherId, data.teacherId),
					eq(teacherPayments.status, "pending"),
				),
				with: {
					teacher: true,
					class: true,
				},
			});

			if (pendingPayments.length === 0) {
				return {
					settledCount: 0,
					totalAmount: 0,
					message: "No pending payments found for this teacher",
				};
			}

			// Settle all payments
			const settledPaymentIds: string[] = [];
			let totalAmount = 0;

			for (const payment of pendingPayments) {
				const [updated] = await db
					.update(teacherPayments)
					.set({
						status: "paid",
						recordedBy: data.recordedBy || null,
						notes: data.notes
							? `${payment.notes || ""}\nBulk Settlement: ${data.notes}`.trim()
							: payment.notes,
						updatedAt: new Date(),
					})
					.where(eq(teacherPayments.id, payment.id))
					.returning();

				if (updated) {
					settledPaymentIds.push(updated.publicId);
					totalAmount += parseFloat(payment.amount.toString());
				}
			}

			logger.info(
				`Bulk settled ${settledPaymentIds.length} teacher payments for teacher ${data.teacherId}`,
				{
					teacherId: data.teacherId,
					settledCount: settledPaymentIds.length,
					totalAmount,
				},
			);

			return {
				settledCount: settledPaymentIds.length,
				totalAmount: parseFloat(totalAmount.toFixed(2)),
				settledPaymentIds,
				teacher: pendingPayments[0]?.teacher?.fullName,
				message: `Successfully settled ${settledPaymentIds.length} payment(s)`,
			};
		} catch (error) {
			logger.error("Bulk settle teacher payments error:", error);
			throw error;
		}
	}
}

export const paymentService = new PaymentService();
