import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import type { TaskListData } from "~/types/tasks";
import { useTaskFiltering } from "~/hooks/useTaskFiltering";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskSearchFilter } from "~/components/tasks/TaskSearchFilter";
import { TaskDetails } from "~/components/tasks/TaskDetails";
import { getSession } from "~/services/session.server";
import { getUserById, getUserInfo } from "~/models/user2.server";
import {
  deleteTask,
  deleteUserTaskApplication,
  getTask,
  getUserTasks,
  removeVolunteerFromTask,
  updateTask,
  updateTaskApplicationStatus,
} from "~/models/tasks.server";
import {
  statusOptions,
  applicationStatusOptions,
} from "~/constants/dropdownOptions";
import { tasks, TaskStatus, TaskUrgency } from "@prisma/client";
import TaskManagementActions from "~/components/tasks/TaskManagementActions";
import { SortOrder } from "../search/route";
import { useEffect, useMemo, useState } from "react";
import TaskForm from "~/components/tasks/TaskForm";
import { ServerRuntimeMetaFunction as MetaFunction } from "@remix-run/server-runtime";
import { getCompanionVars } from "~/services/env.server";
import {
  deleteNovuSubscriber,
  triggerNotification,
} from "~/services/novu.server";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";

export const meta: MetaFunction = () => {
  return [
    { title: "Tasks" },
    { name: "description", content: "Manage your tasks on Skillanthropy!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo?.id) {
    return redirect("/zitlogin");
  }

  const companionVars = getCompanionVars();
  const { id: userId, roles: userRole, charityId, name } = userInfo;

  const url = new URL(request.url);
  const deadline = url.searchParams.get("deadline");
  const createdAt = url.searchParams.get("createdAt");
  const updatedAt = url.searchParams.get("updatedAt");
  const taskStatus = url.searchParams.get("status");

  try {
    const { tasks, error, message, status } = await getUserTasks(
      userRole[0],
      taskStatus as TaskStatus,
      userId,
      charityId || undefined,
      deadline as SortOrder,
      createdAt as SortOrder,
      updatedAt as SortOrder,
    );

    if (error) {
      throw new Response(message || "Error loading tasks", {
        status: status || 500,
      });
    }

    return json<TaskListData>({
      tasks,
      userRole,
      userId,
      error: null,
      isLoading: false,
      userName: name,
      uploadURL: companionVars.COMPANION_URL,
      GCPKey: process.env.GOOGLE_MAPS_API_KEY,
    });
  } catch (error) {
    return json({
      tasks: [],
      userRole,
      userId,
      error: error.message,
      isLoading: false,
      userName: null,
      uploadURL: null,
    });
  }
}

export default function ManageTasks() {
  const {
    tasks: initialTasks,
    userRole,
    userId,
    userName,
    uploadURL,
    GCPKey,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher<typeof action>();
  const taskFormFetcher = useFetcher<typeof action>();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [searchParams] = useSearchParams();
  const { isMobile } = useViewport();

  // Local state for UI management
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    // Initialize with URL search param if it exists
    return searchParams.get("taskid") || null;
  });

  const [volunteerFilterType, setVolunteerFilterType] = useState<
    "APPLICATIONS" | "ACTIVE_TASKS"
  >("ACTIVE_TASKS");

  const [isDetailsView, setIsDetailsView] = useState(false);

  // Handle URL updates
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get("taskid");
    if (taskId) {
      setSelectedTaskId(taskId);
      // Remove the taskid from URL after setting the state
      navigate("/dashboard/tasks", { replace: true });
    }
  }, [location.search, navigate]);

  // Find selected task from tasks array
  const selectedTask = useMemo(() => {
    return selectedTaskId
      ? initialTasks.find((task) => task.id === selectedTaskId)
      : null;
  }, [initialTasks, selectedTaskId]);

  // Create optimistic data if a task update is in progress
  const optimisticTask = useMemo(() => {
    if (fetcher.formData && selectedTaskId) {
      const updateData = JSON.parse(
        fetcher.formData.get("updateTaskData") as string,
      );
      return {
        ...selectedTask,
        ...updateData,
        deadline: new Date(updateData.deadline),
      };
    }
    return selectedTask;
  }, [fetcher.formData, selectedTaskId, selectedTask]);

  const {
    searchQuery,
    setSearchQuery,
    filterSort,
    handleFilterChange,
    filteredTasks,
  } = useTaskFiltering(initialTasks);

  const filteredAndTypedTasks = useMemo(() => {
    let tasks = filteredTasks;

    if (userRole.includes("volunteer")) {
      tasks = tasks.filter((task) => {
        if (volunteerFilterType === "APPLICATIONS") {
          // Show tasks where user has applied (excluding accepted applications)
          return task.taskApplications?.some(
            (app) => app.status !== "ACCEPTED",
          );
        } else {
          // ACTIVE_TASKS: Only show tasks with accepted applications
          return task.taskApplications?.some(
            (app) => app.status === "ACCEPTED",
          );
        }
      });
    }

    return tasks;
  }, [filteredTasks, volunteerFilterType, userRole]);

  const handleTaskSelect = (task: tasks) => {
    setSelectedTaskId(task.id);
    setShowCreateTask(false);
    setIsEditing(false);
    if (isMobile) {
      setIsDetailsView(true);
    }
  };

  const handleDelete = (taskId: string) => {
    fetcher.submit({ _action: "deleteTask", taskId }, { method: "POST" });
    setSelectedTaskId(null);
  };

  // task creation related functions
  const handleCreateTask = () => {
    setShowCreateTask((preValue) => !preValue);
  };

  interface TaskFormData {
    title: string;
    description: string;
    impact: string;
    requiredSkills: string[];
    category: string[];
    urgency: TaskUrgency;
    volunteersNeeded: number;
    deadline: Date;
    deliverables: string[];
    resources: {
      name: string;
      size: number;
      url: string;
      extension: string;
    }[];
  }

  const handleTaskSubmit = (formData: TaskFormData) => {
    // Clear previous data to ensure fresh validation
    taskFormFetcher.data = undefined;

    taskFormFetcher.submit(
      { _action: "createTask", formData: JSON.stringify(formData) },
      {
        action: "/api/task/create",
        method: "POST",
      },
    );
  };

  const handleTaskEdit = (taskData?: tasks) => {
    if (taskData) {
      console.log("Editing task data:", taskData);
      console.log("Location data:", taskData.location);

      // Prepare resources
      const trimmedAttachments = taskData.resources.map((upload) => {
        return {
          name: upload.name || null,
          extension: upload.extension || null,
          type: upload.type || null,
          size: upload.size || null,
          uploadURL: upload.uploadURL || null,
        };
      });

      // Prepare the update data, explicitly including the location field
      // Note: We're explicitly passing location: null when it's null
      const updateData = {
        title: taskData.title,
        description: taskData.description,
        requiredSkills: taskData.requiredSkills,
        impact: taskData.impact,
        category: taskData.category,
        deadline: taskData.deadline,
        volunteersNeeded: taskData.volunteersNeeded,
        deliverables: taskData.deliverables,
        resources: trimmedAttachments,
        urgency: taskData.urgency,
        // Explicitly include location, even when it's null
        location: taskData.location,
      };

      console.log("Update data being sent:", updateData);

      fetcher.submit(
        {
          _action: "updateTask",
          taskId: taskData.id,
          updateTaskData: JSON.stringify(updateData),
        },
        { method: "POST" },
      );
      setIsEditing(false);
    } else {
      setIsEditing(!isEditing);
    }
  };

  // Handle form reset only on successful submission
  useEffect(() => {
    if (taskFormFetcher.data && !taskFormFetcher.data.error) {
      setShowCreateTask(false);
    }
  }, [taskFormFetcher.data]);

  return (
    <div className="flex flex-col lg:flex-row w-full lg:min-h-screen p-4 -mt-8">
      <AnimatePresence mode="wait">
        {!isDetailsView && (
          <motion.div
            className="lg:w-1/3 w-full p-4 shadow-md space-y-4 rounded-md border border-basePrimaryDark overflow-auto"
            initial={{ opacity: 0, x: isMobile ? -40 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key="task-list"
          >
            <TaskManagementActions
              userRole={userRole}
              onCreateTask={handleCreateTask}
              isLoading={fetcher.state !== "idle"}
              selectedTaskId={selectedTaskId}
              onVolunteerFilterChange={setVolunteerFilterType}
              activeVolunteerFilter={volunteerFilterType}
            />

            <TaskSearchFilter
              onSearch={setSearchQuery}
              searchQuery={searchQuery}
              filterSort={filterSort}
              onFilterChange={handleFilterChange}
              userRole={userRole}
              statusOptions={statusOptions}
              applicationStatusOptions={applicationStatusOptions}
              filterType={volunteerFilterType}
            />

            <TaskList
              tasks={filteredAndTypedTasks}
              isLoading={false}
              error={
                !filteredAndTypedTasks ? "Error fetching tasks" : undefined
              }
              onTaskSelect={handleTaskSelect}
              selectedTaskId={selectedTaskId}
              userRole={userRole[0]}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!showCreateTask && (
        <AnimatePresence mode="wait">
          <motion.div
            className="lg:w-2/3 w-full pt-4 lg:pt-0"
            initial={{ opacity: 0, x: isMobile ? 40 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key={isDetailsView ? "task-detail-view" : "task-detail-default"}
          >
            {isDetailsView && isMobile && (
              <motion.button
                className="flex items-center space-x-2 text-baseSecondary mb-4 p-2 hover:bg-basePrimaryLight rounded-lg transition-colors"
                onClick={() => setIsDetailsView(false)}
                aria-label="Go back to task list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft size={20} />
                <span>Back to tasks</span>
              </motion.button>
            )}
            {optimisticTask ? (
              isEditing ? (
                <TaskForm
                  initialData={optimisticTask}
                  onSubmit={(formData) =>
                    handleTaskEdit({ ...optimisticTask, ...formData })
                  }
                  onCancel={() => setIsEditing(false)}
                  isEditing={true}
                  serverValidation={fetcher.data?.error || []}
                  isSubmitting={fetcher.state === "submitting"}
                  uploadURL={uploadURL}
                  GCPKey={GCPKey}
                />
              ) : (
                <TaskDetails
                  task={optimisticTask}
                  userRole={userRole}
                  userId={userId}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => handleDelete(optimisticTask.id)}
                  isEditing={isEditing}
                  error={fetcher.data?.error}
                  isError={Boolean(fetcher.data?.error)}
                  userName={userName}
                  uploadURL={uploadURL}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-baseSecondary">
                Select a task to view details
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {showCreateTask && (
        <div className="lg:w-2/3 w-full p-4">
          <TaskForm
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setShowCreateTask(false);
              taskFormFetcher.data = undefined;
            }}
            serverValidation={taskFormFetcher.data?.error || []}
            isSubmitting={taskFormFetcher.state === "submitting"}
            uploadURL={uploadURL}
            GCPKey={GCPKey}
          />
        </div>
      )}
    </div>
  );
}

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
