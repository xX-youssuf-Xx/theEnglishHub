import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, users } from "../db/schema";
import { logger } from "../utils/logger";

export class AuditService {
	async logAction(data: {
		userId?: number | null;
		action: string;
		entityType: string;
		entityId?: number | null;
		oldValues?: unknown;
		newValues?: unknown;
		ipAddress?: string | null;
		userAgent?: string | null;
	}) {
		try {
			await db.insert(auditLogs).values({
				userId: data.userId ?? null,
				action: data.action,
				entityType: data.entityType,
				entityId: data.entityId ?? null,
				oldValues: data.oldValues ?? null,
				newValues: data.newValues ?? null,
				ipAddress: data.ipAddress ?? null,
				userAgent: data.userAgent ?? null,
			});
		} catch (error) {
			logger.error("Audit log insertion failed:", error);
		}
	}

	async getLogs(params: {
		page?: number;
		limit?: number;
		userPublicId?: string;
		action?: string;
		entityType?: string;
	}) {
		const page = params.page || 1;
		const limit = params.limit || 20;
		const offset = (page - 1) * limit;

		let userIdFilter: number | undefined;
		if (params.userPublicId) {
			const user = await db.query.users.findFirst({
				where: eq(users.publicId, params.userPublicId),
			});
			userIdFilter = user?.id;
		}

		let whereClause;
		if (userIdFilter) {
			whereClause = eq(auditLogs.userId, userIdFilter);
		}
		if (params.action) {
			whereClause = whereClause
				? and(whereClause, eq(auditLogs.action, params.action))
				: eq(auditLogs.action, params.action);
		}
		if (params.entityType) {
			whereClause = whereClause
				? and(whereClause, eq(auditLogs.entityType, params.entityType))
				: eq(auditLogs.entityType, params.entityType);
		}

		const [rows, totalRows] = await Promise.all([
			db.query.auditLogs.findMany({
				where: whereClause,
				with: {
					user: true,
				},
				orderBy: [desc(auditLogs.createdAt)],
				limit,
				offset,
			}),
			db.query.auditLogs.findMany({
				where: whereClause,
			}),
		]);

		return {
			data: rows.map((row) => ({
				id: row.publicId,
				action: row.action,
				entityType: row.entityType,
				entityId: row.entityId,
				oldValues: row.oldValues,
				newValues: row.newValues,
				ipAddress: row.ipAddress,
				userAgent: row.userAgent,
				createdAt: row.createdAt,
				user: row.user
					? {
							id: row.user.publicId,
							username: row.user.username,
							role: row.user.role,
						}
					: null,
			})),
			pagination: {
				page,
				limit,
				total: totalRows.length,
				totalPages: Math.ceil(totalRows.length / limit),
			},
		};
	}
}

export const auditService = new AuditService();
