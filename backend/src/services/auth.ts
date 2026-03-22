import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { permissions, users } from "../db/schema";
import { generateToken, hashPassword, verifyPassword } from "../utils/auth";
import { logger } from "../utils/logger";

export class AuthService {
	async login(username: string, password: string) {
		const startTime = Date.now();

		try {
			// Use Drizzle ORM with select for better performance
			const userResult = await db
				.select({
					id: users.id,
					publicId: users.publicId,
					username: users.username,
					passwordHash: users.passwordHash,
					role: users.role,
					isActive: users.isActive,
					lastLogin: users.lastLogin,
					createdAt: users.createdAt,
					updatedAt: users.updatedAt,
				})
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			const user = userResult[0];

			if (!user || !user.isActive) {
				throw new Error("Invalid credentials");
			}

			// Verify password - this is the slow part (bcrypt)
			const passwordStart = Date.now();
			const isValidPassword = await verifyPassword(password, user.passwordHash);
			logger.info(`Password verification took ${Date.now() - passwordStart}ms`);

			if (!isValidPassword) {
				throw new Error("Invalid credentials");
			}

			// Update last login in background (don't await)
			db.update(users)
				.set({ lastLogin: new Date() })
				.where(eq(users.id, user.id))
				.execute()
				.catch((err) => logger.error("Failed to update last login:", err));

			// Get permissions
			const permissionsResult = await db
				.select({
					permissionKey: permissions.permissionKey,
				})
				.from(permissions)
				.where(eq(permissions.userId, user.id));

			const permissionKeys = permissionsResult
				.filter((p) => p.granted !== false)
				.map((p) => p.permissionKey);

			// Generate token
			const tokenStart = Date.now();
			const token = generateToken({
				id: user.id,
				publicId: user.publicId,
				username: user.username,
				role: user.role,
				isActive: user.isActive,
				lastLogin: user.lastLogin,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			});
			logger.info(`Token generation took ${Date.now() - tokenStart}ms`);

			const totalTime = Date.now() - startTime;
			logger.info(`Total login time: ${totalTime}ms`);

			return {
				token,
				user: {
					id: user.publicId,
					username: user.username,
					role: user.role,
					permissions: permissionKeys,
				},
			};
		} catch (error) {
			logger.error("Login error:", error);
			throw error;
		}
	}

	async createUser(data: {
		username: string;
		password: string;
		role: "admin" | "assistant";
	}) {
		try {
			const passwordHash = await hashPassword(data.password);

			const [user] = await db
				.insert(users)
				.values({
					username: data.username,
					passwordHash,
					role: data.role,
				})
				.returning();

			// Add default permissions for assistant
			if (data.role === "assistant") {
				const defaultPermissions = [
					"view_students",
					"edit_students",
					"record_payments",
					"view_payment_status",
				];

				await db.insert(permissions).values(
					defaultPermissions.map((key) => ({
						userId: user.id,
						permissionKey: key,
						granted: true,
					})),
				);
			}

			return {
				id: user.publicId,
				username: user.username,
				role: user.role,
			};
		} catch (error) {
			logger.error("Create user error:", error);
			throw error;
		}
	}

	async getUsers() {
		try {
			const usersResult = await db.query.users.findMany({
				with: {
					permissions: true,
				},
				orderBy: [desc(users.createdAt)],
			});

			return {
				data: usersResult.map((user) => ({
					id: user.publicId,
					username: user.username,
					role: user.role,
					isActive: user.isActive,
					lastLogin: user.lastLogin,
					createdAt: user.createdAt,
					permissions: user.permissions
						.filter((permission) => permission.granted !== false)
						.map((permission) => permission.permissionKey),
				})),
			};
		} catch (error) {
			logger.error("Get users error:", error);
			throw error;
		}
	}

	async changePassword(
		userId: number,
		currentPassword: string,
		newPassword: string,
	) {
		try {
			const user = await db.query.users.findFirst({
				where: eq(users.id, userId),
			});

			if (!user) {
				throw new Error("User not found");
			}

			const isValidPassword = await verifyPassword(
				currentPassword,
				user.passwordHash,
			);

			if (!isValidPassword) {
				throw new Error("Current password is incorrect");
			}

			const newPasswordHash = await hashPassword(newPassword);

			await db
				.update(users)
				.set({ passwordHash: newPasswordHash })
				.where(eq(users.id, userId));

			return { success: true };
		} catch (error) {
			logger.error("Change password error:", error);
			throw error;
		}
	}

	async resetUserPasswordByPublicId(userPublicId: string, newPassword: string) {
		try {
			const user = await db.query.users.findFirst({
				where: eq(users.publicId, userPublicId),
			});

			if (!user) {
				throw new Error("User not found");
			}

			const newPasswordHash = await hashPassword(newPassword);

			await db
				.update(users)
				.set({ passwordHash: newPasswordHash, updatedAt: new Date() })
				.where(eq(users.id, user.id));

			return {
				success: true,
				user: {
					id: user.publicId,
					username: user.username,
				},
			};
		} catch (error) {
			logger.error("Admin reset password error:", error);
			throw error;
		}
	}
}

export const authService = new AuthService();
