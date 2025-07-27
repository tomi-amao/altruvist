import {
  tasks,
  ApplicationStatus,
  Prisma,
  taskApplications,
  TaskStatus,
  TaskUrgency,
} from "@prisma/client";
import { prisma } from "~/services/db.server";
import { SortOrder } from "~/routes/_base.search/route";
import { ObjectIdSchema } from "~/services/validators.server";
import {
  INDICES,
  indexDocument,
  deleteDocument,
  isMeilisearchConnected,
} from "~/services/meilisearch.server";
import { addNovuSubscriberToTopic, createTopic } from "~/services/novu.server";

export const createTask = async (
  taskData: Partial<tasks>,
  charityId: string,
  userId: string,
) => {
  try {
    if (
      !taskData.title ||
      !taskData.impact ||
      !taskData.deadline ||
      !taskData.description
    ) {
      return { message: "No data", error: "400" };
    }

    const task = await prisma.tasks.create({
      data: {
        title: taskData.title,
        category: taskData.category,
        impact: taskData.impact,
        location: taskData.location,
        deadline: taskData.deadline,
        urgency: taskData.urgency,
        deliverables: taskData.deliverables,
        description: taskData.description,
        volunteersNeeded: taskData.volunteersNeeded || 1,
        requiredSkills: taskData.requiredSkills,
        resources: taskData.resources,
        status: "NOT_STARTED",
        rewardAmount: taskData.rewardAmount || null, // Store token reward amount
        creatorWalletAddress: taskData.creatorWalletAddress || null, // Store creator's Solana wallet address
        ...(charityId && {
          charity: {
            connect: { id: charityId },
          },
        }),
        createdBy: {
          connect: { id: userId },
        },
      },
    });

    // Index the new task in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.TASKS, task);
    }

    // Create a new topic for the task
    const { topicKey: charityTopicKey } = await createTopic(
      `tasks:charities:${task.id}`,
      task.title,
    );
    const { topicKey: volunteerTopicKey } = await createTopic(
      `tasks:volunteers:${task.id}`,
      task.title,
    );

    if (!charityTopicKey || !volunteerTopicKey) {
      throw new Error("Failed to create topic keys");
    }

    const addTopicToTask = await prisma.tasks.update({
      where: { id: task.id },
      data: { notifyTopicId: [charityTopicKey, volunteerTopicKey] },
    });
    // Subscribe the task creator to the task topic
    console.log("Updated task with topic key:", addTopicToTask.notifyTopicId);
    await addNovuSubscriberToTopic([userId], charityTopicKey ?? "");

    return { task, message: "Task successfully created", status: 200 };
  } catch (error) {
    return {
      task: null,
      message: `Unable to create task: ${error}`,
      status: 500,
    };
  }
};

export async function getAllTasks({ skip = 0, take = 12 } = {}) {
  const [tasks, totalCount] = await Promise.all([
    prisma.tasks.findMany({
      skip,
      take,
      include: {
        charity: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        taskApplications: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
    }),
    prisma.tasks.count(),
  ]);

  return {
    allTasks: tasks,
    totalCount,
  };
}

export async function getExploreTasks(
  cursor: string | null = null,
  limit: number = 10,
  category: string[],
  skills: string[],
  urgency: string,
  status: string,
  deadline: string,
  createdAt: string,
  updatedAt: string,
  locationType?: string,
) {
  if (cursor === "null") {
    cursor = null;
  }

  let whereClause: Prisma.tasksWhereInput = {
    ...(category[0] && { category: { hasSome: category } }),
    ...(skills[0] && { requiredSkills: { hasSome: skills } }),
    ...(urgency !== "" && { urgency: { equals: urgency as TaskUrgency } }),
    ...(status !== "" && { status: { equals: status as TaskStatus } }),
  };

  // Add location type filter based on location field
  if (locationType && locationType !== "") {
    // Create two separate tasks queries - one for remote and one for onsite
    // based on the filter selection

    if (locationType === "REMOTE") {
      // For MongoDB through Prisma, use a raw query parameter
      whereClause.location = null;
    } else if (locationType === "ONSITE") {
      // For MongoDB through Prisma, non-null check
      whereClause.NOT = { location: null };
    }
  }

  // for type safety, ensure order value is either asc or desc
  const getOrderDirection = (value: string): SortOrder | undefined => {
    return value === "asc" || value === "desc"
      ? (value as SortOrder)
      : undefined;
  };

  const tasks = await prisma.tasks.findMany({
    take: limit,
    where: whereClause,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: [
      ...(getOrderDirection(deadline)
        ? [{ deadline: getOrderDirection(deadline) }]
        : []),
      ...(getOrderDirection(createdAt)
        ? [{ createdAt: getOrderDirection(createdAt) }]
        : [{ createdAt: "desc" as SortOrder }]),
      ...(getOrderDirection(updatedAt)
        ? [{ updatedAt: getOrderDirection(updatedAt) }]
        : []),
    ],
    include: {
      charity: {
        select: {
          id: true,
          name: true,
        },
      },
      taskApplications: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const nextCursor = tasks.length === limit ? tasks[tasks.length - 1].id : null;

  return {
    tasks,
    nextCursor,
  };
}

export const getUserTasks = async (
  userRole: string,
  taskStatus?: TaskStatus | ApplicationStatus,
  userId?: string,
  charityId?: string,
  deadline?: SortOrder,
  createdAt?: SortOrder,
  updatedAt?: SortOrder,
  take?: number,
) => {
  // Add validation at the start of the function
  if (!userId) {
    return {
      tasks: null,
      message: "User ID is required",
      error: "Missing user ID",
      status: 400,
    };
  }

  // Validate ObjectId format first
  const objectIdValidation = ObjectIdSchema.safeParse(userId);
  if (!objectIdValidation.success) {
    return {
      tasks: null,
      message: "Invalid user ID format",
      error: "Malformed ObjectID",
      status: 400,
    };
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        tasks: null,
        message: "User not found",
        error: "User does not exist",
        status: 404,
      };
    }
    const getOrderDirection = (value: string): SortOrder | undefined => {
      return value === "asc" || value === "desc"
        ? (value as SortOrder)
        : undefined;
    };
    // Continue with existing logic for different user roles
    if (userRole === "charity") {
      try {
        // First, get the charity memberships for this user to find all charities
        // where the user has admin, creator, coordinator, or editor roles
        const charityMemberships = await prisma.charityMemberships.findMany({
          where: {
            userId,
            roles: {
              hasSome: ["admin", "creator", "coordinator", "editor"],
            },
          },
          select: {
            charityId: true,
          },
        });

        // Extract charity IDs from memberships
        const charityIds = charityMemberships.map(
          (membership) => membership.charityId,
        );

        // Find tasks for all these charities + tasks created directly by the user
        const tasks = await prisma.tasks.findMany({
          ...(take && { take }),
          where: {
            OR: [
              // Tasks created directly by the user
              { userId },
              // Tasks belonging to charities where the user has appropriate role
              {
                charityId: {
                  in: charityIds.length > 0 ? charityIds : undefined,
                },
              },
            ],
            ...(taskStatus && { status: taskStatus as ApplicationStatus }),
            ...(charityId && { charityId }), // If a specific charity ID is provided
          },
          include: {
            taskApplications: { include: { user: true } },
            charity: true,
            createdBy: true,
          },
          orderBy: [
            ...(getOrderDirection(deadline!)
              ? [{ deadline: getOrderDirection(deadline || "desc") }]
              : []),
            ...(getOrderDirection(updatedAt!)
              ? [{ updatedAt: getOrderDirection(updatedAt || "desc") }]
              : []),
            ...(getOrderDirection(createdAt!)
              ? [{ createdAt: getOrderDirection(createdAt || "desc") }]
              : []),
            { createdAt: "desc" },
          ],
        });

        return {
          tasks,
          message: "Successfully Retrieved User tasks",
          error: null,
          status: 200,
        };
      } catch (error) {
        return {
          tasks: null,
          message: "No user tasks found",
          error,
          status: 500,
        };
      }
    }
    if (userRole === "volunteer") {
      try {
        const taskApplications = await prisma.taskApplications.findMany({
          ...(take && { take }),
          where: {
            userId,
            ...(taskStatus && { status: taskStatus as ApplicationStatus }),
          },
          include: {
            task: { include: { createdBy: true, taskApplications: true } },
            charity: true,
          },
          orderBy: [
            ...(getOrderDirection(deadline!)
              ? [{ task: { deadline: getOrderDirection(deadline || "desc") } }]
              : []),
            ...(getOrderDirection(updatedAt!)
              ? [
                  {
                    task: { updatedAt: getOrderDirection(updatedAt || "desc") },
                  },
                ]
              : []),
            ...(getOrderDirection(createdAt!)
              ? [
                  {
                    task: { createdAt: getOrderDirection(createdAt || "desc") },
                  },
                ]
              : []),
            { createdAt: "desc" },
          ],
        });

        // Transform task applications into structured format
        const tasks = taskApplications.map((application) => ({
          // Spread all task properties
          ...application.task,
          // Override taskApplications with the current user's application
          taskApplications: [
            {
              id: application.id,
              userId: application.userId,
              status: application.status,
              createdAt: application.createdAt,
              updatedAt: application.updatedAt,
              message: application.message,
              charityId: application.charityId,
              taskId: application.taskId,
              volunteerWalletAddress: application.volunteerWalletAddress,
            },
          ],
          // Add charity information
          charity: application.charity,
        }));

        return {
          tasks,
          taskApplications,
          message: "Successfully Retrieved User tasks",
          error: null,
          status: 200,
        };
      } catch (error) {
        return {
          tasks: null,
          taskApplications: null,
          message: "No user tasks found",
          error,
          status: 500,
        };
      }
    }
    return {
      tasks: null,
      message: "No user tasks found",
      error: "No user role provided",
      status: 500,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      console.error("Database error:", error.message);
      throw new Response("Invalid user ID", { status: 400 });
    }

    // Handle other errors
    throw error;
  }
};

export const deleteUserTaskApplication = async (applicationId: string) => {
  try {
    const deletedApplication = await prisma.taskApplications.delete({
      where: { id: applicationId },
    });

    console.log(" Deleted application", deletedApplication);

    return {
      deletedApplication,
      message: "Successfully Deleted User Task Application",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      deletedApplication: null,
      message: "Failed to delete user task application",
      error,
      status: 500,
    };
  }
};

export const updateTask = async (
  taskId: string,
  updateTaskData: Prisma.tasksUpdateInput,
) => {
  console.log("Update Task Data Pre", updateTaskData);

  try {
    // Ensure location field is explicitly included in the update
    // This prevents the location field from being filtered out when it's null
    const dataToUpdate = {
      ...updateTaskData,
      // If location is explicitly null, we want to keep it that way
      // This ensures REMOTE tasks have their location set to null
      ...(Object.prototype.hasOwnProperty.call(updateTaskData, "location")
        ? {
            location: updateTaskData.location,
          }
        : { location: null }),
    };

    console.log("Final update data with location:", dataToUpdate);

    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    // Update the task in Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await indexDocument(INDICES.TASKS, updatedTask);
    }

    return {
      tasks: updatedTask,
      message: "Task successfully updated",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      tasks: null,
      message: "Task could not be updated",
      error,
      status: 500,
    };
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const deletedTask = await prisma.tasks.delete({
      where: { id: taskId },
    });

    // Delete the task from Meilisearch
    const meiliConnected = await isMeilisearchConnected();
    if (meiliConnected) {
      await deleteDocument(INDICES.TASKS, taskId);
    }

    return {
      task: deletedTask,
      message: "Task successfully deleted",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      task: null,
      message: "Task could not be deleted",
      error,
      status: 500,
    };
  }
};

export const acceptTaskApplication = async (
  taskApplication: taskApplications,
) => {
  console.log("Task Application", taskApplication);

  const { id: taskApplicationId, taskId } = taskApplication;
  console.log("Task Application ID", taskApplicationId);

  try {
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
      },
      include: {
        taskApplications: true,
      },
    });

    if (!task) {
      return { error: "Task not found", status: 404 };
    } else if (task.volunteersNeeded === 0) {
      return { error: "Task is already full", status: 400 };
    }
    const updatedTaskApplication = await prisma.taskApplications.update({
      where: { id: taskApplicationId },
      data: { status: "ACCEPTED" },
    });
    console.log(
      "Successfully accepted task application",
      updatedTaskApplication,
    );

    return { updatedTaskApplication, status: 200, error: null };
  } catch (error) {
    return { updatedTaskApplication: null, status: 500, error };
  }
};

interface UpdateTaskApplicationResponse {
  error: boolean;
  message?: string;
  data?: taskApplications;
}

export async function updateTaskApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
): Promise<UpdateTaskApplicationResponse> {
  try {
    // Validate the applicationId
    if (!applicationId) {
      return {
        error: true,
        message: "Application ID is required",
      };
    }

    // First, get the current application to check if it exists
    const currentApplication = await prisma.taskApplications.findUnique({
      where: { id: applicationId },
      include: {
        task: true, // Include task to check volunteersNeeded if needed
      },
    });

    if (!currentApplication) {
      return {
        error: true,
        message: "Task application not found",
      };
    }

    // If updating to ACCEPTED, check if there are spots available
    if (newStatus === "ACCEPTED") {
      // Get count of current accepted applications
      const acceptedApplicationsCount = await prisma.taskApplications.count({
        where: {
          taskId: currentApplication.taskId,
          status: "ACCEPTED",
        },
      });

      if (
        acceptedApplicationsCount >= currentApplication.task.volunteersNeeded
      ) {
        return {
          error: true,
          message: "No volunteer spots remaining for this task",
        };
      }
    }

    // Update the application status
    const updatedApplication = await prisma.taskApplications.update({
      where: {
        id: applicationId,
      },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            userTitle: true,
            skills: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            volunteersNeeded: true,
          },
        },
      },
    });

    return {
      error: false,
      data: updatedApplication,
    };
  } catch (error) {
    console.error("Error updating task application status:", error);
    return {
      error: true,
      message: "Failed to update task application status",
    };
  }
}

export const rejectTaskApplication = async (
  taskApplication: taskApplications,
) => {
  const { id: taskApplicationId } = taskApplication;
  try {
    const updatedTaskApplication = await prisma.taskApplications.update({
      where: { id: taskApplicationId },
      data: { status: "REJECTED" },
    });
    return { updatedTaskApplication, status: 200, error: null };
  } catch (error) {
    return { updatedTaskApplication: null, status: 500, error };
  }
};

export const removeVolunteerFromTask = async (
  taskApplication: taskApplications,
) => {
  try {
    // Update task application status
    const updatedTaskApplication = await prisma.taskApplications.update({
      where: { id: taskApplication.id },
      data: { status: "WITHDRAWN" },
    });

    console.log(
      "Successfully removed volunteer from task",
      updatedTaskApplication,
    );

    // Update task volunteers needed -> code for this is only necessary when decrementing/incrementing volunteers needed

    // const originalTask = await prisma.tasks.findUnique({
    //   where: { id: taskApplication.taskId },
    // });

    // if (!originalTask) {
    //   return { error: "Task not found", status: 404 };
    // }

    // const initialVolunteersNeeded = originalTask.volunteersNeeded;

    // if (initialVolunteersNeeded <= 0) {
    //   return {
    //     error: "Cannot add more volunteers to this task",
    //     status: 400,
    //   };
    // }

    return { updatedTaskApplication, status: 200, error: null };
  } catch (error) {
    return { updatedTaskApplication: null, status: 500, error };
  }
};

export const getTaskApplication = async (taskApplicationId: string) => {
  console.log("Server", taskApplicationId);

  try {
    const taskApplication = await prisma.taskApplications.findUnique({
      where: { id: taskApplicationId },
    });

    return {
      taskApplication,
      message: "Successfully Retrieved Task Applications",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      taskApplication: null,
      message: "No task applications found",
      error,
      status: 500,
    };
  }
};

export const getTask = (taskId: string) => {
  console.log("Server", taskId);

  return prisma.tasks.findUnique({
    where: { id: taskId },
    include: {
      charity: true,
      taskApplications: true,
    },
  });
};

export const getTasksByCharityId = async (charityId: string) => {
  if (!charityId) {
    return {
      tasks: null,
      message: "Charity ID is required",
      error: "Missing charity ID",
      status: 400,
    };
  }

  try {
    const tasks = await prisma.tasks.findMany({
      where: {
        charityId: charityId,
      },
      include: {
        taskApplications: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return {
      tasks,
      message: "Successfully retrieved charity tasks",
      error: null,
      status: 200,
    };
  } catch (error) {
    return {
      tasks: null,
      message: "Failed to retrieve charity tasks",
      error,
      status: 500,
    };
  }
};
