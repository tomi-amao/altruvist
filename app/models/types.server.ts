import type { charities, tasks, TaskUrgency, users } from "@prisma/client";
import { TaskResource } from "~/types/tasks";

export interface newusersForm {
  role: string;
  title: string;
  tags: string[];
  picture: string;
  bio: string;
  charityWebsite?: string;
}

export interface NewTaskFormData {
  title: string;
  description: string;
  requiredSkills: string[];
  impact: string;
  resources: TaskResource[];
  category: string[];
  deadline: string;
  volunteersNeeded: number | undefined;
  urgency: TaskUrgency;
  deliverables: string[];
}

export type CombinedCollections = users & charities & tasks;

export interface MultiSearchDocuments {
  collection: string;
  data: CombinedCollections;
}
