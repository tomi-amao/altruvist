import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
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

/** Response type for comment-related actions */
interface ActionResponse {
  success: boolean;
  comment?: Comment; // Single comment data
  comments?: Comment[]; // Full list of comments
  error?: string;
}

/** Comment data structure */
interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  replies?: Comment[];
}

/**
 * Handles all comment-related actions: create, edit, and reply
 * @param params - Contains taskId from the URL
 * @param request - HTTP request object
 */
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

    const taskId = params.taskId;
    if (!taskId) {
      return json<ActionResponse>(
        {
          success: false,
          error: "Task ID is required.",
        },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;

    switch (action) {
      case "createComment": {
        const newCommentData = JSON.parse(
          formData.get("newCommentData") as string,
        );
        const createdComment = await createComment(newCommentData);

        // Get the newly created comment with user data
        const updatedComments = await getCommentsForTask(taskId);
        const fullComment = updatedComments.find(
          (c) => c.id === createdComment.id,
        );
        const task = await getTask(taskId);

        // Determine who to notify based on the user's role
        const isCharity = userInfo?.roles?.includes("charity");
        
        // Select the appropriate topic key to notify
        const topicKeyToNotify = isCharity 
          ? task?.notifyTopicId.find(item => item.includes("volunteers")) // If charity is commenting, notify volunteers
          : task?.notifyTopicId.find(item => item.includes("charities")); // If volunteer is commenting, notify charities

        await triggerNotification({
          userInfo,
          workflowId: "comments-feed",
          notification: {
            subject: `${userInfo?.name} has commented on ${task?.title}`,
            body: `${newCommentData.content}`,
            type: "comment",
            taskId: task?.id,
          },
          type: "Topic",
          topicKey: topicKeyToNotify
        });

        return json<ActionResponse>({
          success: true,
          comment: fullComment,
          comments: updatedComments,
        });
      }

      case "editComment": {
        const { commentId, content } = JSON.parse(
          formData.get("editData") as string,
        );
        const updatedComment = await editComment(commentId, content);
        const updatedComments = await getCommentsForTask(taskId);

        return json<ActionResponse>({
          success: true,
          comment: updatedComment,
          comments: updatedComments,
        });
      }

      case "createReply": {
        const replyData = JSON.parse(formData.get("replyData") as string);
        const createdReply = await createReply(replyData);
        const updatedComments = await getCommentsForTask(taskId);
        const task = await getTask(taskId);

        // Find the full reply data including user info
        let fullReply: Comment | null = null;
        updatedComments.forEach((comment) => {
          comment.replies?.forEach((reply) => {
            if (reply.id === createdReply.id) {
              fullReply = reply;
            }
          });
        });

        // Determine who to notify based on the user's role
        const isCharity = userInfo?.roles?.includes("charity");
        
        // Select the appropriate topic key to notify
        const topicKeyToNotify = isCharity 
          ? task?.notifyTopicId.find(item => item.includes("volunteers")) // If charity is replying, notify volunteers
          : task?.notifyTopicId.find(item => item.includes("charities")); // If volunteer is replying, notify charities

        await triggerNotification({
          userInfo,
          workflowId: "comments-feed",
          notification: {
            subject: `Comment on ${task?.title}`,
            body: `${userInfo?.name}: ${replyData.content}`,
            type: "comment",
            taskId: task?.id,
          },
          type: "Topic",
          topicKey: topicKeyToNotify
        });

        return json<ActionResponse>({
          success: true,
          comment: fullReply,
          comments: updatedComments,
        });
      }

      case "deleteComment": {
        const commentId = formData.get("commentId") as string;
        await deleteComment(commentId);
        return json<ActionResponse>({
          success: true,
        });
      }

      default:
        return json<ActionResponse>(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Comment action error:", error);
    return json<ActionResponse>(
      {
        success: false,
        error: "An error occurred while processing your request",
      },
      { status: 500 },
    );
  }
}

/**
 * Loads comments for a specific task
 * @param params - Contains taskId from the URL
 */
export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const taskId = params.taskId;
    if (!taskId) {
      return json(
        {
          success: false,
          error: "Task ID is required.",
        },
        { status: 400 },
      );
    }

    const comments = await getCommentsForTask(taskId);

    return json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Comments loader error:", error);
    return json(
      {
        success: false,
        error: "Failed to load comments",
      },
      { status: 500 },
    );
  }
}
