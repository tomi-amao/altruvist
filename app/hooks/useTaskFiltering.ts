import { useState, useEffect } from "react";
import {
  applicationStatusOptions,
  statusOptions,
} from "~/constants/dropdownOptions";
import type { Task, FilterSortState } from "~/types/tasks";

export function useTaskFiltering(initialTasks: Task[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSort, setFilterSort] = useState<FilterSortState>({
    skills: [],
    charity: [],
    urgency: [],
    status: [],
    deadline: [],
    createdAt: [],
    updatedAt: [],
  });

  const [filteredTasks, setFilteredTasks] = useState(initialTasks);

  useEffect(() => {
    let result = initialTasks;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (filterSort.status.length > 0) {
      result = result.filter((task) => {
        // For task status
        if (statusOptions.includes(filterSort.status[0])) {
          return task.status === filterSort.status[0];
        }
        // For application status
        else if (applicationStatusOptions.includes(filterSort.status[0])) {
          return task.taskApplications?.some(
            (app) => app.status === filterSort.status[0],
          );
        }
        return true;
      });
    }

    // Apply urgency filter
    if (filterSort.urgency.length > 0) {
      result = result.filter((task) =>
        filterSort.urgency.includes(task.urgency || "LOW"),
      );
    }

    // Apply skills filter
    if (filterSort.skills.length > 0) {
      result = result.filter((task) =>
        task.requiredSkills.some((skill) => filterSort.skills.includes(skill)),
      );
    }

    // Apply sorting
    if (filterSort.deadline.length > 0) {
      const direction = filterSort.deadline[0];
      result.sort((a, b) => {
        const comparison =
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        return direction === "asc" ? comparison : -comparison;
      });
    }

    setFilteredTasks(result);
  }, [searchQuery, filterSort, initialTasks]);

  const handleFilterChange = (
    filter: string,
    option: string,
    selected: boolean,
  ) => {
    setFilterSort((prev) => ({
      ...prev,
      [filter]: selected ? [option] : [],
    }));
  };

  return {
    searchQuery,
    setSearchQuery,
    filterSort,
    handleFilterChange,
    filteredTasks,
  };
}
