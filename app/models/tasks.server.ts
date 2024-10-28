import { tasks, TaskStatus } from "@prisma/client";
import { prisma } from "~/services/db.server";
import type { Prisma } from "@prisma/client";

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
        deadline: taskData.deadline,
        urgency: taskData.urgency,
        deliverables: taskData.deliverables,
        description: taskData.description,
        volunteersNeeded: taskData.volunteersNeeded || 0,
        requiredSkills: taskData.requiredSkills,
        resources: taskData.resources,
        status: "INCOMPLETE",
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
    return { task, message: "Task successfully created", status: 200 };
  } catch (error) {
    return {
      task: null,
      message: `Unable to create task: ${error}`,
      status: 500,
    };
  }
};

export const getAllTasks = async () => {
  try {
    const allTasks = await prisma.tasks.findMany({
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
      },
    });
    return { allTasks, error: null, message: "Successfully fetched tasks" };
  } catch (error) {
    return { allTasks: null, error, message: "Unable to fetch tasks" };
  }
};

export const getUserTasks = async (userId: string) => {
  try {
    const tasks = await prisma.taskApplications.findMany({
      where: { userId },
      include: {
        task: { include: { createdBy: true, taskApplications: true } },
        charity: true,
      },
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
};

export const deleteUserTaskApplication = async (
  taskId: string,
  userId: string,
) => {
  try {
    const deletedApplication = await prisma.taskApplications.deleteMany({
      where: { taskId, userId },
    });

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

export const getCharityTasks = async (charityId: string) => {
  if (charityId.length < 0) {
    return {
      tasks: [],
      message: "Please provide a charity id",
      error: "No charity Id provided ",
      status: 400,
    };
  }
  try {
    const tasks = await prisma.tasks.findMany({
      where: { charityId: charityId },
      include: { taskApplications: true, charity: true, createdBy: true },
    });
    // console.log("returned", tasks);

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
};

export const updateTask = async (
  taskId: string,
  updateTaskData: Prisma.tasksUpdateInput,
) => {
  try {
    const updatedTask = await prisma.tasks.update({
      where: { id: taskId },
      data: updateTaskData,
    });
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
