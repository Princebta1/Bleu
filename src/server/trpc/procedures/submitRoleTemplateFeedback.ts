import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const submitRoleTemplateFeedback = baseProcedure
  .input(
    z.object({
      token: z.string(),
      roleId: z.number(),
      templateId: z.string().optional(),
      rating: z.number().min(1).max(5),
      feedback: z.string().min(1),
      permissionsFeedback: z
        .array(
          z.object({
            permissionName: z.string(),
            hasPermission: z.boolean(),
            shouldHave: z.boolean(),
            comment: z.string().optional(),
          })
        )
        .optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { user } = await authenticateUser(input.token);

    // Verify the role exists
    const role = await db.role.findUnique({
      where: { id: input.roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Role not found",
      });
    }

    // Verify the user has this role or has permission to provide feedback
    if (user.roleId !== input.roleId) {
      // Check if user has manage_roles permission (admins can provide feedback on any role)
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
          message: "You can only provide feedback on your own role",
        });
      }
    }

    // Create the feedback
    const feedback = await db.roleTemplateFeedback.create({
      data: {
        userId: user.id,
        roleId: input.roleId,
        templateId: input.templateId,
        rating: input.rating,
        feedback: input.feedback,
        permissionsFeedback: input.permissionsFeedback
          ? JSON.stringify(input.permissionsFeedback)
          : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        feedback: feedback.feedback,
        createdAt: feedback.createdAt,
        user: feedback.user,
      },
    };
  });
