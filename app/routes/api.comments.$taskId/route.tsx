import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "react-router";
import {
  createComment,
  getCommentsForTask,
  editComment,
  createReply,
  deleteComment,
} from "~/models/comments.server";
import { getTask } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { triggerNotification } from "~/services/novu.server";
import { getSession } from "~/services/session.server";
import { getSignedUrlForFile } from "~/services/s3.server";

// Define Prisma Comment type structure based on potential schema
type PrismaComment = Awaited<ReturnType<typeof getCommentsForTask>>[number];
// Define the user type from the PrismaComment for clarity
type PrismaUser = PrismaComment["user"];
// Define the reply type from PrismaComment
type PrismaReply = PrismaComment["replies"][number];

/** Response type for comment-related actions */
interface ActionResponse {
  success: boolean;
  comment?: CommentWithSignedUrl; // Use updated type
  comments?: CommentWithSignedUrl[]; // Use updated type
  error?: string;
}

// Define the structure for the user with the added signed URL
interface UserWithSignedUrl extends PrismaUser {
  signedProfilePictureUrl?: string | null;
}

// Define the main comment structure including the signed URL for the user and typed replies
interface CommentWithSignedUrl extends Omit<PrismaComment, "user" | "replies"> {
  user: UserWithSignedUrl;
  replies?: CommentWithSignedUrl[]; // Recursive type for replies
}

/**
 * Helper function to add signed URLs to comments and replies
 * @param comments - List of comments (Prisma type) to process
 */
async function addSignedUrlsToComments(
  comments: PrismaComment[],
): Promise<CommentWithSignedUrl[]> {
  const processComment = async (
    comment: PrismaComment | PrismaReply, // Can process comments or replies
  ): Promise<CommentWithSignedUrl> => {
    let signedUrl: string | null = null;
    if (comment.user.profilePicture) {
      try {
        // Pass true to extract and decode the key from the stored URL
        signedUrl = await getSignedUrlForFile(
          comment.user.profilePicture,
          true, // <-- Add this argument
        );
      } catch (error) {
        console.error(
          `Failed to get signed URL for ${comment.user.profilePicture}:`,
          error,
        );
      }
    }

    // Process replies recursively if they exist
    const processedReplies = comment.replies
      ? await Promise.all(comment.replies.map(processComment))
      : [];

    // Construct the comment/reply with the signed URL
    // Need to cast the base comment/reply type to fit CommentWithSignedUrl structure
    const baseComment = comment as Omit<PrismaComment, "user" | "replies">;

    return {
      ...baseComment,
      user: {
        ...comment.user,
        signedProfilePictureUrl: signedUrl,
      },
      replies: processedReplies,
    };
  };

  // Map over top-level comments and process each one
  return Promise.all(comments.map(processComment));
}

export async function action({ params, request }: ActionFunctionArgs) {
  try {
    const session = await getSession(request);
    const accessToken = session.get("accessToken");

    if (!accessToken) {
      return redirect("/zitlogin");
    }

    const { userInfo } = await getUserInfo(accessToken);
    if (!userInfo?.id) {
      return redirect("/zitlogin");
    }

    // Rename taskId to avoid conflict in loader scope
    const routeTaskId = params.taskId;
    if (!routeTaskId) {
      return {
        success: false,
        error: "Task ID is required.",
      };
    }

    const formData = await request.formData();
    const actionType = formData.get("_action") as string;

    switch (actionType) {
      case "createComment": {
        const newCommentData = JSON.parse(
          formData.get("newCommentData") as string,
        );
        const createdComment = await createComment(newCommentData);
        // Rename commentsRaw to avoid conflict in loader scope
        const actionCommentsRaw = await getCommentsForTask(routeTaskId);
        const updatedCommentsWithUrls =
          await addSignedUrlsToComments(actionCommentsRaw);
        const fullComment = updatedCommentsWithUrls.find(
          (c) => c.id === createdComment.id,
        );
        const task = await getTask(routeTaskId);
        const isCharity = userInfo?.roles?.includes("charity");
        const topicKeyToNotify = isCharity
          ? task?.notifyTopicId.find((item) => item.includes("volunteers"))
          : task?.notifyTopicId.find((item) => item.includes("charities"));

        if (topicKeyToNotify && task) {
          await triggerNotification({
            userInfo,
            workflowId: "comments-feed",
            notification: {
              subject: `${userInfo?.name} has commented on ${task.title}`,
              body: `${newCommentData.content}`,
              type: "comment",
              taskId: task.id,
            },
            type: "Topic",
            topicKey: topicKeyToNotify,
          });
        }

        return {
          success: true,
          comment: fullComment,
          comments: updatedCommentsWithUrls,
        };
      }

      case "editComment": {
        const { commentId, content } = JSON.parse(
          formData.get("editData") as string,
        );
        const updatedCommentRaw = await editComment(commentId, content);
        const actionCommentsRaw = await getCommentsForTask(routeTaskId);
        const updatedCommentsWithUrls =
          await addSignedUrlsToComments(actionCommentsRaw);
        const fullUpdatedComment = updatedCommentsWithUrls.find(
          (c) => c.id === updatedCommentRaw.id,
        );

        return {
          success: true,
          comment: fullUpdatedComment,
          comments: updatedCommentsWithUrls,
        };
      }

      case "createReply": {
        const replyData = JSON.parse(formData.get("replyData") as string);
        const createdReply = await createReply(replyData);
        const actionCommentsRaw = await getCommentsForTask(routeTaskId);
        const updatedCommentsWithUrls =
          await addSignedUrlsToComments(actionCommentsRaw);

        let fullReply: CommentWithSignedUrl | undefined = undefined;
        for (const comment of updatedCommentsWithUrls) {
          if (comment.replies) {
            for (const reply of comment.replies) {
              if (reply.id === createdReply.id) {
                fullReply = reply;
                break;
              }
            }
          }
          if (fullReply) break;
        }

        const task = await getTask(routeTaskId);
        const isCharity = userInfo?.roles?.includes("charity");
        const topicKeyToNotify = isCharity
          ? task?.notifyTopicId.find((item) => item.includes("volunteers"))
          : task?.notifyTopicId.find((item) => item.includes("charities"));

        if (topicKeyToNotify && task) {
          await triggerNotification({
            userInfo,
            workflowId: "comments-feed",
            notification: {
              subject: `Comment on ${task.title}`,
              body: `${userInfo?.name}: ${replyData.content}`,
              type: "comment",
              taskId: task.id,
            },
            type: "Topic",
            topicKey: topicKeyToNotify,
          });
        }

        return {
          success: true,
          comment: fullReply,
          comments: updatedCommentsWithUrls,
        };
      }

      case "deleteComment": {
        const commentId = formData.get("commentId") as string;
        await deleteComment(commentId);
        const actionCommentsRaw = await getCommentsForTask(routeTaskId);
        const updatedCommentsWithUrls =
          await addSignedUrlsToComments(actionCommentsRaw);
        return {
          success: true,
          comments: updatedCommentsWithUrls,
        };
      }

      default:
        return {
          success: false,
          error: "Invalid action",
        };
    }
  } catch (error) {
    console.error("Comment action error:", error);
    return {
      success: false,
      error: "An error occurred while processing your request",
    };
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    // Use a distinct name for taskId in loader scope
    const loaderTaskId = params.taskId;
    if (!loaderTaskId) {
      return { success: false, error: "Task ID is required." }
    }

    // Use a distinct name for commentsRaw in loader scope
    const loaderCommentsRaw = await getCommentsForTask(loaderTaskId);
    const commentsWithUrls = await addSignedUrlsToComments(loaderCommentsRaw);

    return {
      success: true,
      comments: commentsWithUrls,
    };
  } catch (error) {
    console.error("Comments loader error:", error);
    return {
      success: false,
      error: "Failed to load comments",
    };
  }
}
