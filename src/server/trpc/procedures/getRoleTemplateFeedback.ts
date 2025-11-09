import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser } from "~/server/utils/auth";

export const getRoleTemplateFeedback = baseProcedure
  .input(
    z.object({
      token: z.string(),
      roleId: z.number().optional(),
      templateId: z.string().optional(),
      includeResolved: z.boolean().default(false),
    })
  )
  .query(async ({ input }) => {
    const { user } = await authenticateUser(input.token);

    // Check if user has permission to view feedback
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

    const canManageRoles = userRole?.rolePermissions.some(
      (rp) => rp.permission.name === "manage_roles"
    );

    // Build where clause
    const whereClause: any = {
      user: {
        companyId: user.companyId,
      },
    };

    // If not an admin, only show their own feedback
    if (!canManageRoles) {
      whereClause.userId = user.id;
    }

    if (input.roleId) {
      whereClause.roleId = input.roleId;
    }

    if (input.templateId) {
      whereClause.templateId = input.templateId;
    }

    if (!input.includeResolved) {
      whereClause.isResolved = false;
    }

    // Fetch feedback
    const feedbackList = await db.roleTemplateFeedback.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get role information for each feedback
    const roleIds = [...new Set(feedbackList.map((f) => f.roleId))];
    const roles = await db.role.findMany({
      where: {
        id: { in: roleIds },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const roleMap = new Map(roles.map((r) => [r.id, r]));

    // Format feedback with role information
    const formattedFeedback = feedbackList.map((f) => {
      const role = roleMap.get(f.roleId);
      return {
        id: f.id,
        userId: f.userId,
        user: f.user,
        roleId: f.roleId,
        roleName: role?.name || "Unknown Role",
        templateId: f.templateId,
        rating: f.rating,
        feedback: f.feedback,
        permissionsFeedback: f.permissionsFeedback
          ? JSON.parse(f.permissionsFeedback)
          : null,
        isResolved: f.isResolved,
        adminNotes: f.adminNotes,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        rolePermissions: role?.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          displayName: rp.permission.displayName,
        })),
      };
    });

    // Calculate statistics
    const stats = {
      total: formattedFeedback.length,
      unresolved: formattedFeedback.filter((f) => !f.isResolved).length,
      averageRating:
        formattedFeedback.length > 0
          ? formattedFeedback.reduce((sum, f) => sum + f.rating, 0) /
            formattedFeedback.length
          : 0,
      byRating: {
        1: formattedFeedback.filter((f) => f.rating === 1).length,
        2: formattedFeedback.filter((f) => f.rating === 2).length,
        3: formattedFeedback.filter((f) => f.rating === 3).length,
        4: formattedFeedback.filter((f) => f.rating === 4).length,
        5: formattedFeedback.filter((f) => f.rating === 5).length,
      },
    };

    return {
      feedback: formattedFeedback,
      stats,
      canManageRoles,
    };
  });
