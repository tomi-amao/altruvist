import { MetaFunction } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskFiltering } from "~/hooks/useTaskFiltering";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskSearchFilter } from "~/components/tasks/TaskSearchFilter";
import { TaskDetails } from "~/components/tasks/TaskDetails";
import {
  statusOptions,
  applicationStatusOptions,
} from "~/constants/dropdownOptions";
import { tasks, TaskUrgency } from "@prisma/client";
import TaskManagementActions from "~/components/tasks/TaskManagementActions";
import { useEffect, useMemo, useState } from "react";
import TaskForm from "~/components/tasks/TaskForm";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";
import { loader } from "./loader";
import { action } from "./action";

export { loader, action };

export const meta: MetaFunction = () => {
  return [
    { title: "Dashboard Tasks | Altruvist" },
    { name: "description", content: "Manage your tasks on Altruvist!" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
  ];
};

export default function ManageTasks() {
  const {
    tasks: initialTasks,
    userRole,
    userId,
    userName,
    uploadURL,
    GCPKey,
    userCharities = [], // Extract userCharities from loader data with default empty array
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
            className="lg:w-1/3 w-full p-4  space-y-4 rounded-md border border-basePrimaryDark overflow-auto"
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
                  userCharities={userCharities}
                  defaultCharityId={optimisticTask.charityId}
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
            userCharities={userCharities}
            defaultCharityId={
              userCharities.length === 1 ? userCharities[0].id : ""
            }
          />
        </div>
      )}
    </div>
  );
}
