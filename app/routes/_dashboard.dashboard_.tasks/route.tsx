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
import type { TaskListData } from "~/types/tasks";
import { useTaskFiltering } from "~/hooks/useTaskFiltering";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskSearchFilter } from "~/components/tasks/TaskSearchFilter";
import { TaskDetails } from "~/components/tasks/TaskDetails";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  deleteTask,
  deleteUserTaskApplication,
  getUserTasks,
  removeVolunteerFromTask,
  updateTask,
  updateTaskApplicationStatus,
} from "~/models/tasks.server";
import {
  statusOptions,
  applicationStatusOptions,
} from "~/components/utils/OptionsForDropdowns";
import { tasks, TaskStatus, TaskUrgency } from "@prisma/client";
import TaskManagementActions from "~/components/tasks/TaskManagementActions";
import { SortOrder } from "../search/route";
import { useEffect, useMemo, useState } from "react";
import TaskForm from "~/components/utils/TaskForm";

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

  const { id: userId, roles: userRole, charityId, name } = userInfo;

  const url = new URL(request.url);
  const deadline = url.searchParams.get("deadline");
  const createdAt = url.searchParams.get("createdAt");
  const updatedAt = url.searchParams.get("updatedAt");
  const taskStatus = url.searchParams.get("status");
  const search = url.searchParams.get("search");

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
    });
  } catch (error) {
    return json({
      tasks: [],
      userRole,
      userId,
      error: error.message,
      isLoading: false,
      userName: null,
    });
  }
}

export default function ManageTasks() {
  const {
    tasks: initialTasks,
    userRole,
    userId,
    error,
    userName,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();
  const fetcher = useFetcher<typeof action>();
  const taskFormFetcher = useFetcher<typeof action>();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state for UI management
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    // Initialize with URL search param if it exists
    return searchParams.get("taskid") || null;
  });

  const [volunteerFilterType, setVolunteerFilterType] = useState<
    "APPLICATIONS" | "ACTIVE_TASKS"
  >("ACTIVE_TASKS");

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
      const trimmedAttachments = taskData.resources.map((upload) => {
        return {
          name: upload.name || null,
          extension: upload.extension || null,
          type: upload.type || null,
          size: upload.size || null,
          uploadURL: upload.uploadURL || null,
        };
      });

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
      };

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
      <div className="lg:w-1/3 w-full p-4 shadow-md space-y-4 rounded-md border border-basePrimaryDark overflow-auto">
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
          error={!filteredAndTypedTasks ? "Error fetching tasks" : undefined}
          onTaskSelect={handleTaskSelect}
          selectedTaskId={selectedTaskId}
          userRole={userRole[0]}
        />
      </div>
      {/* 
      <div className="hidden relative lg:flex items-center px-1">
        <div className="h-screen w-[1px] bg-baseSecondary" />
      </div> */}

      {!showCreateTask && (
        <div className="lg:w-2/3 w-full pt-4 lg:pt-0">
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
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-baseSecondary">
              Select a task to view details
            </div>
          )}
        </div>
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
          }).filter(([_, value]) => value),
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
