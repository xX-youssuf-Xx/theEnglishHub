import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc/context';
import { authService } from '../services/auth';

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      return authService.login(input.username, input.password);
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: ctx.user.publicId,
        username: ctx.user.username,
        role: ctx.user.role,
      };
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      return authService.changePassword(ctx.user.id, input.currentPassword, input.newPassword);
    }),

  createUser: adminProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      role: z.enum(['admin', 'assistant']),
    }))
    .mutation(async ({ input }) => {
      return authService.createUser(input);
    }),
});
