import {
  MetaFunction,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useTaskFiltering } from "~/hooks/useTaskFiltering";
import { TaskList } from "~/components/tasks/TaskList";
import { TaskSearchFilter } from "~/components/tasks/TaskSearchFilter";
import { TaskDetails } from "~/components/tasks/TaskDetails";
import {
  statusOptions,
  applicationStatusOptions,
} from "~/constants/dropdownOptions";
import { tasks } from "@prisma/client";
import TaskManagementActions from "~/components/tasks/TaskManagementActions";
import { useEffect, useMemo, useState } from "react";
import TaskForm from "~/components/tasks/TaskForm";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";
import { loader } from "./loader";
import { action } from "./action";
import { useSolanaService } from "~/hooks/useSolanaService";
import { toast } from "react-toastify";

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

  // Move the Solana service hooks to component level
  const { solanaService, taskEscrowService } = useSolanaService();
  const wallet = solanaService?.wallet;

  // Local state for UI management
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
    return selectedTaskId && initialTasks
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

  const handleDelete = async (taskId: string) => {
    if (isProcessing) return; // Prevent double submission
    console.log(location.state);

    const taskToDelete = initialTasks?.find((task) => task.id === taskId);
    if (!taskToDelete) {
      console.error("Task not found for deletion");
      toast.error("Task not found. Please refresh the page and try again.");
      return;
    }

    setIsProcessing(true);
    toast.info("Starting task deletion...");

    try {
      // First, try to cancel the task on-chain if it has a reward amount and creator wallet
      if (
        taskToDelete.rewardAmount &&
        taskToDelete.rewardAmount > 0 &&
        taskEscrowService
      ) {
        console.log("Cancelling task on-chain:", taskId);
        toast.info("Cancelling blockchain escrow...");

        const txSignature = await taskEscrowService.deleteTask(taskId);

        if (!txSignature) {
          console.error(
            "Failed to cancel task on-chain, aborting database deletion",
          );
          toast.error(
            "Failed to cancel blockchain escrow. Task deletion aborted to prevent fund loss.",
          );
          return;
        }

        console.log("Task cancelled on-chain successfully:", txSignature);
        toast.success("Blockchain escrow cancelled successfully!");
      } else {
        console.log(
          "Skipping on-chain cancellation - no reward amount or wallet address",
        );
        toast.info("No blockchain escrow to cancel for this task.");
      }

      // If on-chain cancellation succeeded (or was skipped), proceed with database deletion
      toast.info("Deleting task from database...");
      fetcher.submit({ _action: "deleteTask", taskId }, { method: "POST" });
      setSelectedTaskId(null);
    } catch (error) {
      console.error("Error during task deletion:", error);
      toast.error(
        `Failed to delete task: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // task creation related functions
  const handleCreateTask = () => {
    setShowCreateTask((preValue) => !preValue);
  };

  const handleTaskSubmit = async (formData: tasks) => {
    // Clear previous data to ensure fresh validation
    taskFormFetcher.data = undefined;

    const taskData = {
      ...formData,
      creatorWalletAddress: wallet?.publicKey?.toBase58() || null,
    };

    console.log("Submitting task form data:", taskData);

    // Use fetcher for form submission to get automatic UI updates
    taskFormFetcher.submit(
      { _action: "createTask", formData: JSON.stringify(taskData) },
      {
        action: "/api/task/create",
        method: "POST",
      },
    );
  };

  // Handle escrow creation after successful task creation
  useEffect(() => {
    const createTaskEscrow = async () => {
      if (
        taskEscrowService &&
        taskFormFetcher.data &&
        !taskFormFetcher.data.error
      ) {
        try {
          console.log("Creating task escrow with data:", taskFormFetcher.data);

          // Check if the response has the expected structure for task creation
          if ("task" in taskFormFetcher.data && taskFormFetcher.data.task) {
            const task = taskFormFetcher.data.task;

            // Only create escrow if there's a positive reward amount
            if (
              task.rewardAmount &&
              typeof task.rewardAmount === "number" &&
              task.rewardAmount > 0
            ) {
              const faucetInfo = await solanaService?.getFaucetInfo();

              const txSignature = await taskEscrowService.createTaskEscrow({
                taskId: task.id || "",
                rewardAmount: task.rewardAmount || 0,
                creatorWallet: wallet?.publicKey?.toBase58() || "",
                mintAddress: faucetInfo?.mint || "",
              });

              if (txSignature) {
                console.log("Task escrow created with signature:", txSignature);
              }
            } else {
              console.log(
                "Skipping escrow creation - no positive reward amount specified",
              );
            }
          }
        } catch (error) {
          console.error("Failed to create task escrow:", error);
          // Note: Task was created successfully, but escrow failed
          // You might want to show a warning to the user
        }
      }
    };

    createTaskEscrow();
  }, [taskFormFetcher.data, taskEscrowService, solanaService, wallet]);

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
        rewardAmount: taskData.rewardAmount || null,
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

  // Reset deletion state when fetcher completes
  useEffect(() => {
    if (fetcher.state === "idle" && isProcessing) {
      // Check if the deletion was successful
      if (fetcher.data && !fetcher.data.error) {
        toast.success("Task deleted successfully from database!");
      } else if (fetcher.data?.error) {
        toast.error(`Database deletion failed: ${fetcher.data.error}`);
      }
      setIsProcessing(false);
    }
  }, [fetcher.state, fetcher.data, isProcessing]);

  return (
    <div className="flex flex-col lg:flex-row w-full lg:min-h-screen p-4 -mt-8">
      <AnimatePresence mode="wait">
        {!isDetailsView && (
          <motion.div
            className="lg:w-1/3 w-full p-4  space-y-4 rounded-md border border-basePrimaryDark"
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
                  serverValidation={
                    Array.isArray(fetcher.data?.error) ? fetcher.data.error : []
                  }
                  isSubmitting={fetcher.state === "submitting"}
                  uploadURL={uploadURL || ""}
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
                  userName={userName || undefined}
                  uploadURL={uploadURL || ""}
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
            serverValidation={
              Array.isArray(taskFormFetcher.data?.error)
                ? taskFormFetcher.data.error
                : []
            }
            isSubmitting={taskFormFetcher.state === "submitting"}
            uploadURL={uploadURL || ""}
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
