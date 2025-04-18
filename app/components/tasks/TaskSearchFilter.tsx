import { ChangeEvent, useEffect } from "react";
import { DropdownCard } from "../cards/FilterCard";
import { SecondaryButtonAlt } from "../utils/BasicButton";
import type { FilterSortState } from "~/types/tasks";
import { Funnel, FunnelSimple } from "phosphor-react";
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
  const sortOptions = [
    <Dropdown
      key="createdAt"
      options={["asc", "desc"]}
      placeholder="Created At"
      onSelect={(option, selected) =>
        onFilterChange("createdAt", option, selected)
      }
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filterSort.createdAt}
    />,
    <Dropdown
      key="deadline"
      options={["asc", "desc"]}
      placeholder="Deadline"
      onSelect={(option, selected) =>
        onFilterChange("deadline", option, selected)
      }
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filterSort.deadline}
    />,
    <Dropdown
      key="updatedAt"
      options={["asc", "desc"]}
      placeholder="Updated At"
      onSelect={(option, selected) =>
        onFilterChange("updatedAt", option, selected)
      }
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filterSort.updatedAt}
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
      <input
        type="text"
        placeholder="Search"
        className="w-full flex-grow p-2 bg-basePrimaryDark text-sm lg:text-base rounded font-primary text-baseSecondary"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onSearch(e.target.value)
        }
        value={searchQuery}
      />
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
