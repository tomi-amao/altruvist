import {
  charities,
  taskApplications,
  tasks,
  users,
  TaskStatus,
  TaskUrgency,
} from "@prisma/client";

export interface TaskDetailsData {
  task: tasks;
  userInfo: {
    id: string;
    roles: string[];
  };
}

export interface TaskListData {
  tasks: tasks[];
  userRole: string[];
  userId: string;
  error: string | null;
  isLoading: boolean;
  userName?: string | null;
  uploadURL?: string | null;
  GCPKey?: string;
  userCharities?: Array<{ id: string; name: string }>;
}

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

export interface TaskDetailsProps {
  task: tasks;
  charity?: charities;
  creator: users;
  applications: taskApplications[];
  userRole: string[];
  onUpdate: (taskId: string, data: Partial<tasks>) => void;
  onDelete: (taskId: string) => void;
}

export interface TaskSearchState {
  query: string;
  filters: {
    status: string[];
    urgency: string[];
    skills: string[];
    deadline: string[];
    createdAt: string[];
    updatedAt: string[];
  };
}

export interface TaskManagementState {
  selectedTask: Partial<tasks> | null;
  isEditing: boolean;
  showMessageSection: boolean;
  showApplicants: boolean;
}

export interface FilterSortState {
  skills: string[];
  charity: string[];
  urgency: string[];
  status: string[];
  deadline: string[];
  createdAt: string[];
  updatedAt: string[];
}

export type CombinedCollections = users & charities & tasks;

export interface MultiSearchDocuments {
  collection: string;
  data: CombinedCollections;
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
