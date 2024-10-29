import {
  charities,
  taskApplications,
  TaskStatus,
  TaskUrgency,
  users,
} from "@prisma/client";

export interface TaskResource {
  name: string | null;
  extension: string | null;
  type: string | null;
  size: number | null;
  uploadURL: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  impact: string;
  requiredSkills: string[];
  estimatedHours: number | null;
  category: string[];
  urgency: TaskUrgency | null;
  volunteersNeeded: number;
  status: TaskStatus;
  deadline: string | Date;
  resources: TaskResource[];
  deliverables: string[];
  charity?: Partial<charities>;
  createdBy?: Partial<users>;
  taskApplications?: Partial<taskApplications>[];
}
