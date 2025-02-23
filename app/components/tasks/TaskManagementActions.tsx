import { PrimaryButton, SecondaryButton } from "../utils/BasicButton";

interface TaskManagementActionsProps {
  userRole: string[];
  onCreateTask?: () => void;
  isLoading?: boolean;
  selectedTaskId?: string | null;
  onVolunteerFilterChange?: (
    filterType: "APPLICATIONS" | "ACTIVE_TASKS",
  ) => void;
  activeVolunteerFilter?: "APPLICATIONS" | "ACTIVE_TASKS";
}

export default function TaskManagementActions({
  userRole,
  onCreateTask,
  isLoading,
  onVolunteerFilterChange,
  activeVolunteerFilter = "ACTIVE_TASKS",
}: TaskManagementActionsProps) {
  return (
    <div className="space-y-4">
      {userRole.includes("charity") ? (
        <PrimaryButton
          ariaLabel="create-task"
          text="Create Task"
          action={onCreateTask}
          isDisabled={isLoading}
          className="w-full"
        />
      ) : userRole.includes("volunteer") ? (
        <div className="flex gap-2">
          <SecondaryButton
            ariaLabel="active-tasks"
            text="Active Tasks"
            action={() => onVolunteerFilterChange?.("ACTIVE_TASKS")}
            isSelected={activeVolunteerFilter === "ACTIVE_TASKS"}
          />
          <SecondaryButton
            ariaLabel="applications"
            text="Applications"
            action={() => onVolunteerFilterChange?.("APPLICATIONS")}
            isSelected={activeVolunteerFilter === "APPLICATIONS"}
          />
        </div>
      ) : null}
    </div>
  );
}
