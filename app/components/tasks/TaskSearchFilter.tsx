import { ChangeEvent, useEffect } from "react";
import { DropdownCard } from "../cards/FilterCard";
import { SecondaryButtonAlt } from "../utils/BasicButton";
import type { FilterSortState } from "~/types/tasks";
import { Funnel, FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { Dropdown } from "../utils/selectDropdown";

interface TaskSearchFilterProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  filterSort: FilterSortState;
  onFilterChange: (filter: string, option: string, selected: boolean) => void;
  userRole: string[];
  statusOptions: string[];
  applicationStatusOptions: string[];
  filterType?: string;
}

export function TaskSearchFilter({
  onSearch,
  searchQuery,
  filterSort,
  onFilterChange,
  userRole,
  statusOptions,
  applicationStatusOptions,
  filterType = "APPLICATIONS",
}: TaskSearchFilterProps) {
  // Helper function to get current sort selection for the dropdown
  const getCurrentSortSelection = () => {
    const sortMapping = {
      "createdAt-desc": "Newest First",
      "createdAt-asc": "Oldest First",
      "deadline-asc": "Deadline Soon",
      "deadline-desc": "Deadline Later",
      "updatedAt-desc": "Recently Updated",
      "updatedAt-asc": "Least Recently Updated",
    };

    for (const [field, directions] of Object.entries(filterSort)) {
      if (
        ["createdAt", "deadline", "updatedAt"].includes(field) &&
        directions.length > 0
      ) {
        const key = `${field}-${directions[0]}` as keyof typeof sortMapping;
        return [sortMapping[key]];
      }
    }
    return [];
  };

  const sortOptions = [
    <Dropdown
      key="sort"
      options={[
        "Newest First",
        "Oldest First",
        "Deadline Soon",
        "Deadline Later",
        "Recently Updated",
        "Least Recently Updated",
      ]}
      placeholder="Sort by"
      onSelect={(option, selected) => {
        // Clear all existing sorts first
        Object.keys(filterSort).forEach((field) => {
          if (
            ["createdAt", "deadline", "updatedAt"].includes(field) &&
            filterSort[field].length > 0
          ) {
            onFilterChange(field, filterSort[field][0], false);
          }
        });

        if (selected) {
          const mapping: Record<string, [string, string]> = {
            "Newest First": ["createdAt", "desc"],
            "Oldest First": ["createdAt", "asc"],
            "Deadline Soon": ["deadline", "asc"],
            "Deadline Later": ["deadline", "desc"],
            "Recently Updated": ["updatedAt", "desc"],
            "Least Recently Updated": ["updatedAt", "asc"],
          };
          const [field, direction] = mapping[option];
          onFilterChange(field, direction, true);
        }
      }}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={getCurrentSortSelection()}
    />,
  ];

  const filterOptions = [
    <Dropdown
      key="status"
      options={
        userRole.includes("volunteer")
          ? filterType === "ACTIVE_TASKS"
            ? statusOptions
            : applicationStatusOptions
          : statusOptions
      }
      placeholder="Status"
      onSelect={(option, selected) =>
        onFilterChange("status", option, selected)
      }
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filterSort.status}
    />,
  ];

  // Reset filters when filterType changes
  useEffect(() => {
    if (filterSort.status.length > 0) {
      onFilterChange("status", "", false);
    }
  }, [filterType]);

  const getActiveFilters = () => {
    const active = [];
    if (filterSort.status.length > 0)
      active.push(`Status: ${filterSort.status[0]}`);
    if (filterSort.deadline.length > 0)
      active.push(`Deadline: ${filterSort.deadline[0]}`);
    if (filterSort.createdAt.length > 0)
      active.push(`Created: ${filterSort.createdAt[0]}`);
    if (filterSort.updatedAt.length > 0)
      active.push(`Updated: ${filterSort.updatedAt[0]}`);
    return active;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-8 py-1.5 border border-baseSecondary/20 rounded-lg bg-basePrimaryLight text-baseSecondary text-sm"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onSearch(e.target.value)
          }
          value={searchQuery}
        />
        <MagnifyingGlass
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-baseSecondary/60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <div className="mt-2 flex items-center space-x-2">
            <DropdownCard
              dropdownList={sortOptions}
              dropdownToggle={(handleToggle) => (
                <SecondaryButtonAlt
                  ariaLabel="sort button"
                  text="Sort"
                  icon={<FunnelSimple className="h-5 w-5" />}
                  action={handleToggle}
                />
              )}
            />
            <DropdownCard
              dropdownList={filterOptions}
              dropdownToggle={(handleToggle) => (
                <SecondaryButtonAlt
                  ariaLabel="filter button"
                  text="Filter"
                  icon={<Funnel className="h-5 w-5" />}
                  action={handleToggle}
                />
              )}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFilters().length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getActiveFilters().map((filter, index) => (
              <span
                key={index}
                className="px-2 py-1 text-sm bg-baseSecondary text-basePrimaryDark rounded-full"
              >
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
