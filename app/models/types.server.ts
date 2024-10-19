import type { TaskUrgency, User } from "@prisma/client";
import { Meta, UppyFile } from "@uppy/core";

export type RegisterForm = {
  email: User["email"];
  password: User["password"];
  lastName: string;
  firstName: string;
};

export type LoginForm = {
  email: User["email"];
  password: User["password"];
};

export interface newUserForm {
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
  resources: UppyFile<Meta, Record<string, never>>[];
  category: string[];
  deadline: string;
  volunteersNeeded: number | null;
  urgency: TaskUrgency;
  deliverables: string[];
}
