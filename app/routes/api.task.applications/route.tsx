import { ActionFunctionArgs, json } from "@remix-run/node";
import {
  updateTask,
  deleteTask,
  updateTaskApplicationStatus,
  removeVolunteerFromTask,
  deleteUserTaskApplication,
  getTaskApplication,
} from "~/models/tasks.server";

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
      case "getTaskApplication": {
        const selectedTaskApplication =
          data.get("selectedTaskApplication")?.toString() || "";

        try {
          const parsedApplication = JSON.parse(selectedTaskApplication);

          if (!parsedApplication.id) {
            return json(
              { error: "Task application ID is required" },
              { status: 400 },
            );
          }

          console.log("Getting Task Application:", parsedApplication.id);
          const taskApplicationResult = await getTaskApplication(
            parsedApplication.id,
          );

          return json({
            taskApplication: taskApplicationResult,
            success: true,
          });
        } catch (error) {
          console.error("Error getting task application:", error);
          return json(
            {
              error: "Failed to get task application",
            },
            { status: 500 },
          );
        }
      }
      case "updateTask": {
        if (!taskId || !updateTaskData) {
          throw new Error("Task ID and update data are required");
        }

        const parsedUpdateTaskData = JSON.parse(updateTaskData);

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

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
      }
      case "deleteApplication": {
        const taskApplication =
          data.get("selectedTaskApplication")?.toString() || "";
        const parsedApplication = JSON.parse(taskApplication);

        const result = await deleteUserTaskApplication(parsedApplication.id);

        console.log(result);

        if (result.error) {
          return json({ error: result.message }, { status: 400 });
        }

        return json({ success: true, application: result.data });
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
