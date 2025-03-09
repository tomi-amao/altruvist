export type LoaderReturn = {
  isConnected: boolean;
  sampleTasks: Array<any>;
  sampleUsers: Array<any>;
  sampleCharities: Array<any>;
  indicesStats: Record<string, any> | null;
  indices: typeof import("~/constants/search").INDICES;
};

export type ActionReturn = {
  success: boolean;
  message: string;
  action: string;
  error?: string;
  errorDetails?: string;
  result?: any;
  details?: any;
};
