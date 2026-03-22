import { z } from "zod";
import { auditService } from "../services/audit";
import { adminProcedure, router } from "../trpc/context";

export const auditRouter = router({
	getLogs: adminProcedure
		.input(
			z
				.object({
					page: z.number().optional(),
					limit: z.number().optional(),
					userId: z.string().uuid().optional(),
					action: z.string().optional(),
					entityType: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			return auditService.getLogs({
				page: input?.page,
				limit: input?.limit,
				userPublicId: input?.userId,
				action: input?.action,
				entityType: input?.entityType,
			});
		}),
});
