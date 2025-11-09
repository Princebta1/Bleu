import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const updateRoleTemplateFeedback = baseProcedure
  .input(
    z.object({
      token: z.string(),
      feedbackId: z.number(),
      isResolved: z.boolean().optional(),
      adminNotes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { user } = await authenticateUser(input.token);

    // Check if user has permission to manage roles
    const userRole = await db.role.findUnique({
      where: { id: user.roleId ?? 0 },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const hasPermission = userRole?.rolePermissions.some(
      (rp) => rp.permission.name === "manage_roles"
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage feedback",
      });
    }

    // Verify feedback exists
    const feedback = await db.roleTemplateFeedback.findUnique({
      where: { id: input.feedbackId },
      include: {
        user: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found",
      });
    }

    // Verify feedback belongs to same company
    if (feedback.user.companyId !== user.companyId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only manage feedback from your own company",
      });
    }

    // Update feedback
    const updated = await db.roleTemplateFeedback.update({
      where: { id: input.feedbackId },
      data: {
        isResolved: input.isResolved ?? feedback.isResolved,
        adminNotes: input.adminNotes ?? feedback.adminNotes,
      },
    });

    return {
      success: true,
      feedback: updated,
    };
  });
