import { LoaderFunctionArgs, json } from "@remix-run/node";
import { getTask } from "~/models/tasks.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Extract taskId from URL params
  const taskId = params.taskId;

  if (!taskId) {
    return json({
      error: "Task ID is required",
      status: 400
    });
  }

  try {
    // Fetch the task data using the getTask function from models/tasks.server.ts
    const task = await getTask(taskId);

    if (!task) {
      return json({
        error: "Task not found",
        status: 404
      });
    }

    return json({
      task,
      status: 200
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return json({
      error: "Failed to fetch task details",
      status: 500
    });
  }
}