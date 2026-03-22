import { z } from "zod";
import { auditService } from "../services/audit";
import { authService } from "../services/auth";
import {
	adminProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../trpc/context";

export const authRouter = router({
	login: publicProcedure
		.input(
			z.object({
				username: z.string(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			try {
				const result = await authService.login(input.username, input.password);

				await auditService.logAction({
					userId: null,
					action: "login_success",
					entityType: "auth_session",
					newValues: {
						username: input.username,
						role: result.user.role,
					},
					ipAddress: ctx.ipAddress,
					userAgent: ctx.userAgent,
				});

				return result;
			} catch (error) {
				await auditService.logAction({
					userId: null,
					action: "login_failed",
					entityType: "auth_session",
					newValues: {
						username: input.username,
					},
					ipAddress: ctx.ipAddress,
					userAgent: ctx.userAgent,
				});
				throw error;
			}
		}),

	me: protectedProcedure.query(async ({ ctx }) => {
		return {
			id: ctx.user.publicId,
			username: ctx.user.username,
			role: ctx.user.role,
		};
	}),

	getUsers: adminProcedure.query(async () => {
		return authService.getUsers();
	}),

	changePassword: protectedProcedure
		.input(
			z.object({
				currentPassword: z.string(),
				newPassword: z.string().min(6),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const result = await authService.changePassword(
				ctx.user.id,
				input.currentPassword,
				input.newPassword,
			);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "change_password",
				entityType: "user",
				newValues: {
					userId: ctx.user.publicId,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),

	createUser: adminProcedure
		.input(
			z.object({
				username: z.string().min(3),
				password: z.string().min(6),
				role: z.enum(["admin", "assistant"]),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const result = await authService.createUser(input);

			await auditService.logAction({
				userId: ctx.user.id,
				action: "create_user",
				entityType: "user",
				newValues: {
					username: input.username,
					role: input.role,
				},
				ipAddress: ctx.ipAddress,
				userAgent: ctx.userAgent,
			});

			return result;
		}),
});
