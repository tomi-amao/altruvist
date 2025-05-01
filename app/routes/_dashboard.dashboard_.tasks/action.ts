import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  deleteTask,
  deleteUserTaskApplication,
  getTask,
  removeVolunteerFromTask,
  updateTask,
  updateTaskApplicationStatus,
} from "~/models/tasks.server";
import { getUserById } from "~/models/user2.server";
import {
  deleteNovuSubscriber,
  triggerNotification,
} from "~/services/novu.server";

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const updateTaskData = data.get("updateTaskData")?.toString();
  const taskId = data.get("taskId")?.toString();
  const userId = data.get("userId")?.toString();
  const intent = data.get("_action")?.toString();

  console.log("Action Type:", intent);
  console.log("Task ID:", taskId);
  console.log("User ID:", userId);

  try {
    switch (intent) {
      case "updateTask": {
        if (!taskId || !updateTaskData) {
          throw new Error("Task ID and update data are required");
        }

        const parsedUpdateTaskData = JSON.parse(updateTaskData);
        console.log("Parsed Update Task Data:", parsedUpdateTaskData);

        // Include all fields in the update operation
        const updateData = Object.fromEntries(
          Object.entries({
            title: parsedUpdateTaskData.title,
            description: parsedUpdateTaskData.description,
            impact: parsedUpdateTaskData.impact,
            requiredSkills: parsedUpdateTaskData.requiredSkills,
            category: parsedUpdateTaskData.category,
            deadline: parsedUpdateTaskData.deadline
              ? new Date(parsedUpdateTaskData.deadline)
              : null,
            volunteersNeeded: parsedUpdateTaskData.volunteersNeeded,
            deliverables: parsedUpdateTaskData.deliverables,
            resources: parsedUpdateTaskData.resources,
            urgency: parsedUpdateTaskData.urgency,
            status: parsedUpdateTaskData.status,
            location: parsedUpdateTaskData.location,
          }).filter(([, value]) => value),
        );

        console.log("Updated Data", updateData);

        const updatedTaskData = await updateTask(taskId, updateData);
        console.log("Updated task data:", updatedTaskData);

        if (updatedTaskData.error) {
          return json({ error: updatedTaskData.message }, { status: 400 });
        }

        return json({ success: true, task: updatedTaskData });
      }

      case "deleteTask": {
        if (!taskId) {
          throw new Error("Task ID is required for deletion");
        }
        const result = await deleteTask(taskId);
        if (result.error) {
          return json(
            {
              updateTaskData: null,
              userIds: null,
              error: result.message,
            },
            { status: 500 },
          );
        }
        return json({
          updateTaskData: null,
          userIds: null,
          success: true,
        });
      }

      case "withdrawApplication": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        const parsedApplication = JSON.parse(taskApplication);

        const result = await updateTaskApplicationStatus(
          parsedApplication.id,
          "WITHDRAWN",
        );

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
      }

      case "acceptTaskApplication": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        const parsedApplication = JSON.parse(taskApplication);

        const result = await updateTaskApplicationStatus(
          parsedApplication.id,
          "ACCEPTED",
        );

        console.log("task application:", parsedApplication.id);

        const { user: userInfo } = await getUserById(userId);
        console.log("taskID:", taskApplication.id);

        const task = await getTask(taskId);
        console.log("task:", task);

        await triggerNotification({
          userInfo,
          workflowId: "applications-feed",
          notification: {
            subject: "Application Update",
            body: `${userInfo?.name} has accepted your application for the task ${task?.title}`,
            type: "application",
            taskApplicationId: parsedApplication.id,
            taskId: task?.id,
          },
          type: "Topic",
          topicKey: task?.notifyTopicId.find((item) =>
            item.includes("volunteers"),
          ),
        });

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
      }

      case "rejectTaskApplication": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        const parsedApplication = JSON.parse(taskApplication);

        const result = await updateTaskApplicationStatus(
          parsedApplication.id,
          "REJECTED",
        );

        console.log("task application:", parsedApplication.id);

        const { user: userInfo } = await getUserById(userId);
        console.log("taskID:", taskApplication.id);

        const task = await getTask(taskId);
        console.log("task:", task);

        await triggerNotification({
          userInfo,
          workflowId: "applications-feed",
          notification: {
            subject: "Application Update",
            body: `${userInfo?.name} has rejected your application for the task ${task?.title}`,
            type: "application",
            taskApplicationId: parsedApplication.id,
            taskId: task?.id,
          },
          type: "Topic",
          topicKey: task?.notifyTopicId.find((item) =>
            item.includes("volunteers"),
          ),
        });

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
      }

      case "removeVolunteer": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        console.log(
          "Task Application Server Action",
          JSON.parse(taskApplication),
        );
        const updatedTaskApplication = await removeVolunteerFromTask(
          JSON.parse(taskApplication),
        );
        console.log("Removed Volunteer from Task ", updatedTaskApplication);

        return { updatedTaskApplication };
      }

      case "undoApplicationStatus": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        const parsedApplication = JSON.parse(taskApplication);
        const result = await updateTaskApplicationStatus(
          parsedApplication.id,
          "PENDING",
        );
        console.log("task application:", parsedApplication.id);

        const { user: userInfo } = await getUserById(userId);
        console.log("taskID:", taskApplication.id);

        const task = await getTask(taskId);
        console.log("task:", task);

        await triggerNotification({
          userInfo,
          workflowId: "applications-feed",
          notification: {
            subject: "New Task Application",
            body: `${userInfo?.name} has applied to the task ${task?.title}`,
            type: "application",
            taskApplicationId: parsedApplication.id,
            taskId: task?.id,
          },
          type: "Topic",
          topicKey: task?.notifyTopicId.find((item) =>
            item.includes("charities"),
          ),
        });

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
      }
      case "deleteApplication": {
        // Handle both direct application and application ID scenarios
        if (data.has("selectedTaskApplication")) {
          // Handle selected task application case
          const taskApplication =
            data.get("selectedTaskApplication")?.toString() || "";
          const parsedApplication = JSON.parse(taskApplication);
          const result = await deleteUserTaskApplication(parsedApplication.id);

          console.log(result);

          const deleteSubscriberResult = await deleteNovuSubscriber(userId);
          console.log("Delete Subscriber Result:", deleteSubscriberResult);

          if (result.error) {
            return json({ error: result.message }, { status: 400 });
          }

          return json({ success: true, application: result.data });
        } else if (taskId && userId) {
          // Handle direct task ID and user ID case (from TaskDetailsCard)
          console.log(
            "Deleting application for task:",
            taskId,
            "and user:",
            userId,
          );

          // Find the task application by taskId and userId
          const task = await getTask(taskId);
          if (!task || !task.taskApplications) {
            return json(
              { error: "Task or task applications not found" },
              { status: 404 },
            );
          }

          const taskApplication = task.taskApplications.find(
            (app) => app.userId === userId,
          );
          if (!taskApplication) {
            return json(
              { error: "Task application not found" },
              { status: 404 },
            );
          }

          const result = await deleteUserTaskApplication(taskApplication.id);

          if (result.error) {
            return json({ error: result.message }, { status: 400 });
          }

          return json({
            success: true,
            message: "Application withdrawn successfully",
            application: result.deletedApplication,
          });
        } else {
          return json(
            { error: "Missing required information" },
            { status: 400 },
          );
        }
      }

      default:
        return { updateTaskData: null, userIds: null };
    }
  } catch (error) {
    console.error("Action error:", error);
    return json(
      {
        updateTaskData: null,
        userIds: null,
        error: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
