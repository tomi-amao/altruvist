import type { TaskUrgency } from "@prisma/client";
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
