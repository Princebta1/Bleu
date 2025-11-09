import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { authenticateUser, checkPermission } from "~/server/utils/auth";

export const removeUser = baseProcedure
  .input(
    z.object({
      token: z.string(),
      userId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const { user } = await authenticateUser(input.token);

    // Check permissions - only Admin and Developer can remove users
    checkPermission(user.role, ["Developer", "Admin"]);

    // Get the user to be removed
    const targetUser = await db.user.findUnique({
      where: { id: input.userId },
    });

    if (!targetUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify the user is in the same company
    if (targetUser.companyId !== user.companyId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot remove users from other companies",
      });
    }

    // Prevent users from removing themselves
    if (targetUser.id === user.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot remove yourself from the team",
      });
    }

    // Get the current user's role to check if they're a Developer
    const currentUserRole = await db.role.findUnique({
      where: { id: user.roleId ?? 0 },
    });

    // Get the target user's role to check if they're a Developer
    const targetUserRole = await db.role.findUnique({
      where: { id: targetUser.roleId ?? 0 },
    });

    // Prevent non-Developers from removing a Developer
    if (targetUserRole?.name === "Developer" && currentUserRole?.name !== "Developer") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Developers can remove another Developer",
      });
    }

    // Deactivate the user instead of deleting
    await db.user.update({
      where: { id: input.userId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: "User has been removed from the team",
    };
  });
