import { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { DropdownCard } from "~/components/cards/FilterCard";
import TaskSummaryCard from "~/components/tasks/taskCard";
import Navbar from "~/components/navigation/Header2";
import {
  CancelButton,
  SecondaryButtonAlt,
} from "~/components/utils/BasicButton";
import {
  locationTypeOptions,
  statusOptions,
  taskCategoryFilterOptions,
  taskCharityCategories,
  urgencyOptions,
} from "~/components/utils/OptionsForDropdowns";
import Dropdown from "~/components/utils/selectDropdown";
import { getExploreTasks, getUserTasks } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import type { Task } from "~/types/tasks";
import { ServerRuntimeMetaFunction as MetaFunction } from "@remix-run/server-runtime";
import { Funnel, FunnelSimple, X } from "phosphor-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Explore" },
    {
      name: "description",
      content:
        "Discover tasks and volunteering opportunities on Skillanthropy!",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const url = new URL(request.url);
  let cursor = url.searchParams.get("cursor");
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  const category = url.searchParams.get("charity")?.split(",") || [];
  const skills = url.searchParams.get("skills")?.split(",") || [];
  const [urgency] = url.searchParams.get("urgency")?.split(",") || [];
  const [status] = url.searchParams.get("status")?.split(",") || [];
  const [deadline] = url.searchParams.get("deadline")?.split(",") || [];
  const [createdAt] = url.searchParams.get("createdAt")?.split(",") || [];
  const [updatedAt] = url.searchParams.get("updatedAt")?.split(",") || [];
  const [locationType] = url.searchParams.get("locationType")?.split(",") || [];

  const { tasks, nextCursor } = await getExploreTasks(
    cursor,
    limit,
    category,
    skills,
    urgency,
    status,
    deadline,
    createdAt,
    updatedAt,
    locationType,
  );

  const { userInfo } = await getUserInfo(accessToken);
  const userRole = userInfo?.roles[0];

  if (userRole === "volunteer") {
    const { tasks: userTasks } = await getUserTasks(
      userRole || "",
      undefined,
      userInfo?.id || "",
    );

    // Get the task ids of the tasks the user has applied to, using the task applications data
    const taskApplications = userTasks?.map((task) => task.id);

    return {
      tasks,
      userInfo,
      nextCursor,
      taskApplications,
    };
  } else {
    return {
      tasks,
      userInfo,
      nextCursor,
      taskApplications: null,
    };
  }
}

// ActiveFilters component to display and allow users to remove active filters
const ActiveFilters = ({ 
  filters, 
  onRemoveFilter 
}: { 
  filters: Record<string, string[]>, 
  onRemoveFilter: (filterType: string, value: string) => void 
}) => {
  // Filter display names for better readability
  const filterDisplayNames: Record<string, string> = {
    skills: "Skill",
    charity: "Charity",
    urgency: "Urgency",
    status: "Status",
    locationType: "Location",
    deadline: "Deadline",
    createdAt: "Created",
    updatedAt: "Updated"
  };

  // Helper to transform sort values to be more readable
  const formatSortValue = (filterType: string, value: string) => {
    if (['deadline', 'createdAt', 'updatedAt'].includes(filterType)) {
      return value === 'asc' ? 'Oldest first' : 'Newest first';
    }
    return value;
  };

  // Get all active filters as {type, value} pairs
  const activeFilters = Object.entries(filters)
    .filter(([_, values]) => values.length > 0 && values[0] !== "")
    .flatMap(([filterType, values]) => 
      values.map(value => ({ type: filterType, value }))
    );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 mb-4">

      {activeFilters.map(({ type, value }) => (
        <button
          key={`${type}-${value}`}
          onClick={() => onRemoveFilter(type, value)}
          className="bg-basePrimaryLight text-baseSecondary px-3 py-1 rounded-full 
                    text-xs flex items-center gap-1 border border-baseSecondary/20
                    hover:bg-basePrimaryDark transition-colors duration-200 group"
          aria-label={`Remove ${filterDisplayNames[type]} filter: ${value}`}
        >
          <span>{filterDisplayNames[type]}:</span> 
          <span className="font-medium">{formatSortValue(type, value)}</span>
          <X size={12} className="ml-1 group-hover:text-dangerPrimary" />
        </button>
      ))}
    </div>
  );
};

export default function Explore() {
  const {
    userInfo,
    tasks: initialTasks,
    nextCursor: initialCursor,
    taskApplications,
  } = useLoaderData<typeof loader>();
  const fetchTasks = useFetcher();
  const [tasks, setTasks] = useState<Task[]>();
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isFilterChange, setIsFilterChange] = useState(false);
  const [showClearFilters, setShowClearFilters] = useState(false);

  // state to store selected filter options
  const [filters, setFilters] = useState({
    skills: [],
    charity: [],
    urgency: [],
    status: [],
    locationType: [],
    deadline: [],
    createdAt: [],
    updatedAt: [],
  });

  // Load initial tasks on component mount
  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
      setCursor(initialCursor);
    }
  }, [initialTasks, initialCursor]);

  const buildSearchParams = (currentCursor: string | null = null) => {
    return new URLSearchParams({
      skills: filters.skills.join(","),
      charity: filters.charity.join(","),
      status: filters.status.join(","),
      urgency: filters.urgency.join(","),
      locationType: filters.locationType.join(","),
      deadline: filters.deadline.join(","),
      createdAt: filters.createdAt.join(","),
      updatedAt: filters.updatedAt.join(","),
      ...(currentCursor && { cursor: currentCursor }),
    });
  };

  const loadMoreTasks = useCallback(() => {
    if (isLoading || cursor === null || isFilterChange || !tasks?.length)
      return;
    setIsLoading(true);
    const searchParams = buildSearchParams(cursor);
    fetchTasks.load(`/explore?${searchParams.toString()}`);
  }, [cursor, isLoading, fetchTasks, isFilterChange, tasks]);

  // Setup intersection observer
  useEffect(() => {
    if (!tasks?.length) return; // Don't set up observer if no initial tasks

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          cursor !== null &&
          !isFilterChange
        ) {
          loadMoreTasks();
        }
      },
      { rootMargin: "200px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreTasks, isLoading, cursor, tasks]);

  const clearFilters = () => {
    setFilters({
      skills: [],
      charity: [],
      urgency: [],
      status: [],
      locationType: [],
      deadline: [],
      createdAt: [],
      updatedAt: [],
    });
  };

  const handleRemoveFilter = (filterType: string, value: string) => {
    setFilters(prevFilters => {
      // If this is a single-select filter, clear it completely
      if (!['charity', 'skills'].includes(filterType)) {
        return {
          ...prevFilters,
          [filterType]: []
        };
      }
      
      // For multi-select filters, remove just the selected value
      return {
        ...prevFilters,
        [filterType]: prevFilters[filterType].filter(item => item !== value)
      };
    });
  };

  const sortList = ["deadline", "createdAt", "updatedAt"];

  // function to handle option selection
  const onSelect = (option: string, selected: boolean, filter: string) => {
    if (sortList.includes(filter)) {
      setFilters((preValue) => {
        return {
          ...preValue,
          ["deadline"]: [],
          ["updatedAt"]: [],
          ["createdAt"]: [],
        };
      });
    }

    setFilters((prevFilters) => {
      const currentOptions = prevFilters[filter];

      // check if the option is already selected
      const isSelected = currentOptions.includes(option);

      // update the array by either adding or removing the selected option
      if (filter == "charity" || filter == "skills") {
        const updatedOptions = isSelected
          ? currentOptions.filter((item: string) => item !== option) // remove if selected
          : [...currentOptions, option]; // add if not selected

        return {
          ...prevFilters,
          [filter]: updatedOptions, // update the specific filter type
        };
      } else {
        const updatedOptions = selected ? option : "";
        return { ...prevFilters, [filter]: [updatedOptions] };
      }
    });
  };

  // use effect to trigger search when filters change
  // Handle filter changes
  useEffect(() => {
    const handleFilterChange = async () => {
      setIsFilterChange(true);
      setIsLoading(true);
      const searchParams = buildSearchParams(null);
      fetchTasks.load(`/explore?${searchParams.toString()}`);
    };

    const isFiltersEmpty = Object.values(filters).every(
      (property) => Array.isArray(property) && property.length === 0,
    );
    setShowClearFilters(!isFiltersEmpty);
    handleFilterChange();
  }, [filters]);

  useEffect(() => {
    if (fetchTasks.data && fetchTasks.data.tasks) {
      if (isFilterChange) {
        setTasks(fetchTasks.data.tasks);
        setIsFilterChange(false);
      } else {
        setTasks((prev) =>
          prev ? [...prev, ...fetchTasks.data.tasks] : fetchTasks.data.tasks,
        );
      }
      setCursor(fetchTasks.data.nextCursor);
      setIsLoading(false);
    }
  }, [fetchTasks.data]);

  const filterOptionsToggle = (handleToggle: () => void) => {
    return (
      <SecondaryButtonAlt
        ariaLabel="filter button"
        text="Filter"
        icon={<Funnel className="h-5 w-5" />}
        action={handleToggle}
      />
    );
  };
  const sortOptionsToggle = (handleToggle: () => void) => {
    return (
      <SecondaryButtonAlt
        ariaLabel="sort button"
        text="Sort"
        icon={<FunnelSimple className="h-5 w-5" />}
        action={handleToggle}
      />
    );
  };

  const filterOptions = [
    <Dropdown
      key="charity"
      options={taskCharityCategories}
      placeholder="Charity"
      onSelect={(option, selected) => onSelect(option, selected, "charity")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.charity}
    />,
    <Dropdown
      key="skills"
      options={taskCategoryFilterOptions}
      placeholder="Skills"
      onSelect={(option, selected) => onSelect(option, selected, "skills")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.skills}
    />,
    <Dropdown
      key="urgency"
      options={urgencyOptions}
      placeholder="Urgency"
      onSelect={(option, selected) => onSelect(option, selected, "urgency")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.urgency}
    />,
    <Dropdown
      key="status"
      options={statusOptions}
      placeholder="Status"
      onSelect={(option, selected) => onSelect(option, selected, "status")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.status}
    />,
    <Dropdown
      key="locationType"
      options={locationTypeOptions}
      placeholder="Location Type"
      onSelect={(option, selected) => onSelect(option, selected, "locationType")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.locationType}
    />,
  ];
  const sortOptions = [
    <Dropdown
      key="createdAt"
      options={["asc", "desc"]}
      placeholder="Created At"
      onSelect={(option, selected) => onSelect(option, selected, "createdAt")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.createdAt}
    />,
    <Dropdown
      key="deadline"
      options={["asc", "desc"]}
      placeholder="Deadline"
      onSelect={(option, selected) => onSelect(option, selected, "deadline")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.deadline}
    />,
    <Dropdown
      key="updatedAt"
      options={["asc", "desc"]}
      placeholder="Updated At"
      onSelect={(option, selected) => onSelect(option, selected, "updatedAt")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.updatedAt}
    />,
  ];
  return (
    <>
      <Navbar userId={userInfo?.id} />
      <div className="m-auto lg:w-8/12  w-full p-4  ">
        <h1 className="mt-16 text-3xl lg:text-5xl font-semibold "> Make a difference </h1>
        <h2> Help charities innovate and make a lasting impact </h2>
        <div className="flex flex-row gap-4  justify-center items-center border-b-2 border-b-baseSecondary p-4">
            <img src="/sewing_charity.png" alt="Placeholder 1" className="w-2/12 h-60 rounded-md object-cover " />
            <img src="/planting_charity.png" alt="Placeholder 1" className="w-2/12 h-60 rounded-md object-cover" />
            <img src="/Giving_community.png" alt="Placeholder 1" className="w-2/12 h-60 rounded-md object-cover" />
            <img src="/skill_sharing.png" alt="Placeholder 1" className="w-2/12 h-60 rounded-md object-cover" />
        </div>
        <div className="flex flex-row gap-2 ">
          <div className="mt-2 flex items-center space-x-2">
            <DropdownCard
              dropdownList={filterOptions}
              dropdownToggle={filterOptionsToggle}
            />
            <DropdownCard
              dropdownList={sortOptions}
              dropdownToggle={sortOptionsToggle}
            />
            {showClearFilters && (
              <CancelButton
                text="Clear Filters"
                ariaLabel="clear filters"
                icon={<X className="h-5 w-5" />}
                action={clearFilters}
              />
            )}
          </div>
        </div>
        <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} />
        <div className="flex flex-row gap-2 flex-wrap m-auto w-full justify-center">
          {tasks?.map((task) => (
            <TaskSummaryCard
              key={task.id}
              title={task.title}
              category={task.category}
              deadline={new Date(task.deadline)}
              description={task.description}
              volunteersNeeded={
                task?.volunteersNeeded -
                task?.taskApplications?.filter(
                  (application) => application.status === "ACCEPTED",
                ).length
              }
              urgency={task.urgency || "LOW"}
              requiredSkills={task.requiredSkills}
              status={task.status}
              id={task.id}
              impact={task.impact}
              charityId={task.charity?.id || null}
              deliverables={task.deliverables}
              resources={task.resources}
              userId={task.createdBy.id}
              charityName={task.charity?.name || ""}
              userName={task.createdBy?.name || ""}
              volunteerDetails={{ taskApplications, userId: userInfo?.id }}
              userRole={userInfo?.roles}
              location={task.location}
            />
          ))}

          <div ref={loadMoreRef} className="w-full flex justify-center p-4">
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 text-baseSecondary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#836953"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="#836953"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            )}
            {cursor === null && !isLoading && tasks.length > 0 && (
              <p className="text-basePrimaryDark">No more tasks to load</p>
            )}
          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
