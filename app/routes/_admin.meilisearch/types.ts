import { tasks, users, charities } from "@prisma/client";
import { INDICES } from "~/constants/search";

export type LoaderReturn = {
  isConnected: boolean;
  sampleTasks: Array<Partial<tasks>>;
  sampleUsers: Array<Partial<users>>;
  sampleCharities: Array<Partial<charities>>;
  indicesStats: Record<string, unknown> | null;
  indices: typeof INDICES;
};

export type ActionReturn = {
  success: boolean;
  message: string;
  action: string;
  error?: string;
  errorDetails?: string;
  result?: unknown;
  details?: unknown;
};
