import { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { DropdownCard } from "~/components/cards/FilterCard";
import TaskSummaryCard from "~/components/cards/taskCard";
import Navbar from "~/components/navigation/Header2";
import {
  CancelButton,
  SecondaryButtonAlt,
} from "~/components/utils/BasicButton";
import { CloseIcon, FilterIcon, SortIcon } from "~/components/utils/icons";
import {
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
  const [deadline] = url.searchParams.get("deadline")?.split(",") || "";
  const [createdAt] = url.searchParams.get("createdAt")?.split(",") || "";
  const [updatedAt] = url.searchParams.get("updatedAt")?.split(",") || "";

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

    const taskApplicationStatus = tasks.map((task) =>
      task.taskApplications.map((application) => application.status),
    );

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
    deadline: [],
    createdAt: [],
    updatedAt: [],
  });

  // Load initial tasks on component mount
  useEffect(() => {
    setTasks(initialTasks as Task[]);
    loadMoreTasks();
  }, []);

  const buildSearchParams = (currentCursor: string | null = null) => {
    return new URLSearchParams({
      skills: filters.skills.join(","),
      charity: filters.charity.join(","),
      status: filters.status.join(","),
      urgency: filters.urgency.join(","),
      deadline: filters.deadline.join(","),
      createdAt: filters.createdAt.join(","),
      updatedAt: filters.updatedAt.join(","),
      ...(currentCursor && { cursor: currentCursor }),
    });
  };
  const loadMoreTasks = useCallback(() => {
    if (isLoading || cursor === null || isFilterChange) return;
    setIsLoading(true);
    const searchParams = buildSearchParams(cursor);
    fetchTasks.load(`/explore?${searchParams.toString()}`);
  }, [cursor, isLoading, fetchTasks, isFilterChange, filters]);

  // Setup intersection observer
  useEffect(() => {
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
  }, [loadMoreTasks, isLoading, cursor]);

  const clearFilters = () => {
    setFilters({
      skills: [],
      charity: [],
      urgency: [],
      status: [],
      deadline: [],
      createdAt: [],
      updatedAt: [],
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
        setTasks((prev) => [...prev, ...fetchTasks.data.tasks]);
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
        icon={<FilterIcon />}
        action={handleToggle}
      />
    );
  };
  const sortOptionsToggle = (handleToggle: () => void) => {
    return (
      <SecondaryButtonAlt
        ariaLabel="sort button"
        text="Sort"
        icon={<SortIcon />}
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
        <h1 className="mt-16"> Make a difference </h1>
        <h2> Help charities innovate and make a lasting impact </h2>
        <div className="flex flex-row gap-4  border-b-2 border-b-baseSecondary p-4">
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
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
                icon={<CloseIcon />}
                action={clearFilters}
              />
            )}
          </div>
        </div>
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
              <p className="text-gray-500">No more tasks to load</p>
            )}
          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
