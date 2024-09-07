import { tasks } from "@prisma/client";
import { prisma } from "~/services/db.server";

export const createTask = async (taskData: tasks) => {
  try {
    const task = prisma.tasks.create({
      data: {
        title: taskData.title,
        category: taskData.category,
        deadline: taskData.deadline,
        status: taskData.status,
        deliverables: taskData.deliverables,
        description: taskData.description,
        volunteersNeeded: taskData.volunteersNeeded,
        charityId: taskData.charityId,
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
