export type AppError = {
  code: "AUTH_ERROR" | "CONNECTION_ERROR" | "NOT_FOUND" | "UNKNOWN_ERROR";
  message: string;
  severity: "error" | "warning" | "info";
};
