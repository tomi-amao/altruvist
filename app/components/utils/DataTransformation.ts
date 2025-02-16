import { TaskResource } from "~/types/tasks";

type taskApplications = {
  id: string;
  taskId: string;
  userId: string;
  charityId: string | null;
  status: string;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  task: {
    resources: TaskResource[];
    id: string;
    title: string;
    description: string;
    impact: string;
    requiredSkills: string[];
    estimatedHours: number | null;
    category: string[];
    urgency: string | null;
    volunteersNeeded: number;
    deliverables: string[];
    deadline: Date;
    charityId: string | null;
    userId: string;
    status: string | null;
    location: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
      id: string;
      userTitle: string | null;
      zitadelId: string;
      email: string;
      name: string;
      skills: string[];
      bio: string | null;
      profilePicture: string | null;
      createdAt: Date;
      updatedAt: Date;
      locale: string;
      roles: string[];
      permissions: string[];
      charityId: string | null;
    };
  };
  charity: {
    id: string | null;
    name: string | null;
    description: string | null;
    website: string | null;
    contactPerson: string | null;
    contactEmail: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    tags: string[] | null;
  } | null;
};

export function transformUserTaskApplications(
  userTaskApplication: taskApplications[] | null,
) {
  return userTaskApplication?.map((item) => ({
    resources: item.task.resources,
    id: item.task.id,
    title: item.task.title,
    description: item.task.description,
    impact: item.task.impact,
    requiredSkills: item.task.requiredSkills,
    estimatedHours: item.task.estimatedHours,
    category: item.task.category,
    urgency: item.task.urgency,
    volunteersNeeded: item.task.volunteersNeeded,
    deliverables: item.task.deliverables,
    deadline: item.task.deadline,
    charityId: item.task.charityId,
    userId: item.task.userId,
    status: item.task.status,
    location: item.task.location,
    createdAt: item.task.createdAt,
    updatedAt: item.task.updatedAt,
    taskApplications: [
      {
        id: item.id,
        userId: item.userId,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    ],
    charity: {
      id: item.charity?.id,
      name: item.charity?.name,
      description: item.charity?.description,
      website: item.charity?.website,
      contactPerson: item.charity?.contactPerson,
      contactEmail: item.charity?.contactEmail,
      createdAt: item.charity?.createdAt,
      updatedAt: item.charity?.updatedAt,
      tags: item.charity?.tags,
    },
    createdBy: item.task.createdBy,
  }));
}

export function transformElasticSearchTasks(elasticSearch) {
  return elasticSearch?.map((item) => ({
    resources: item.resources,
    id: item.id,
    title: item.title,
    description: item.description,
    impact: item.impact,
    requiredSkills: item.requiredSkills,
    category: item.category,
    urgency: item.urgency,
    volunteersNeeded: item.volunteersNeeded,
    deliverables: item.deliverables,
    deadline: item.deadline,
    charityId: item.charityId,
    userId: item.userId,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    taskApplications: item.taskApplications,
    createdBy: item.createdBy,
  }));
}
