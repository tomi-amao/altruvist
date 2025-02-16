import { Prisma } from "@prisma/client";
import { prisma } from "~/services/db.server";

export const getCommentsForTask = async (taskId: string) => {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }
  try {
    const taskComments = await prisma.comment.findMany({
      where: {
        taskId: taskId,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: true,
        replies: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: true,
            replies: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                user: true,
                replies: {
                  include: {
                    user: true,
                    replies: true, // Support up to 4 levels of nesting
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return taskComments;
  } catch (error) {
    console.error("Error getting comments for task:", error);
    throw new Error("Could not get comments for task");
  }
};

export const createComment = async (data: Prisma.commentCreateInput) => {
  if (!data) {
    throw new Error("Comment data is required.");
  }

  try {
    const comment = await prisma.comment.create({
      data: data,
    });

    return comment;
  } catch (error) {
    console.error("Error creating comment:", error);
    throw new Error("Could not create comment");
  }
};

export const editComment = async (commentId: string, content: string) => {
  if (!commentId || !content) {
    throw new Error("Comment ID and content are required.");
  }

  try {
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
      },
    });

    return updatedComment;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw new Error("Could not update comment");
  }
};

export const createReply = async (data: {
  content: string;
  taskId: string;
  userId: string;
  parentId: string;
}) => {
  if (!data.content || !data.parentId) {
    throw new Error("Reply content and parent comment ID are required.");
  }

  try {
    const reply = await prisma.comment.create({
      data: {
        content: data.content,
        taskId: data.taskId,
        userId: data.userId,
        parentId: data.parentId,
      },
    });

    return reply;
  } catch (error) {
    console.error("Error creating reply:", error);
    throw new Error("Could not create reply");
  }
};

export const deleteComment = async (commentId: string) => {
  if (!commentId) {
    throw new Error("Comment ID is required.");
  }

  try {
    // First, recursively delete all nested replies
    await prisma.$transaction(async (prisma) => {
      // Helper function to get all descendant comment IDs
      const getDescendantIds = async (parentId: string): Promise<string[]> => {
        const children = await prisma.comment.findMany({
          where: { parentId },
          select: { id: true },
        });

        const childIds = children.map((c) => c.id);
        const descendantIds = [];

        for (const childId of childIds) {
          const descendants = await getDescendantIds(childId);
          descendantIds.push(...descendants);
        }

        return [...childIds, ...descendantIds];
      };

      // Get all descendant comments
      const descendantIds = await getDescendantIds(commentId);

      // Delete all descendants (if any)
      if (descendantIds.length > 0) {
        await prisma.comment.deleteMany({
          where: {
            id: {
              in: descendantIds,
            },
          },
        });
      }

      // Finally, delete the comment itself
      await prisma.comment.delete({
        where: {
          id: commentId,
        },
      });
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw new Error("Could not delete comment");
  }
};
