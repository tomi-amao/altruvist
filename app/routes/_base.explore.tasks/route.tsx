import {
  LoaderFunctionArgs,
  MetaFunction,
  useFetcher,
  useLoaderData,
} from "react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { DropdownCard } from "~/components/cards/FilterCard";
import TaskSummaryCard from "~/components/tasks/taskCard";
import {
  CancelButton,
  SecondaryButtonAlt,
} from "~/components/utils/BasicButton";
import {
  locationTypeOptions,
  statusOptions,
  charityCategories,
  urgencyOptions,
  volunteeringSkills,
} from "~/constants/dropdownOptions";
import { getExploreTasks, getUserTasks } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import type { Task } from "~/types/tasks";
import {
  ArrowLeft,
  ArrowRight,
  Funnel,
  FunnelSimple,
  X,
} from "@phosphor-icons/react";
import { Dropdown } from "~/components/utils/selectDropdown";
import { prisma } from "~/services/db.server";
import { getSignedUrlForFile } from "~/services/s3.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Explore Tasks" },
    {
      name: "description",
      content: "Discover tasks and volunteering opportunities on Altruvist!",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { charSet: "utf-8" },
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

  // Fetch featured charities (limited to 7)
  const featuredCharities = await prisma.charities.findMany({
    take: 7,
    select: {
      id: true,
      name: true,
      description: true,
      backgroundPicture: true,
      tags: true,
      _count: {
        select: {
          tasks: {
            where: {
              status: {
                in: ["IN_PROGRESS", "NOT_STARTED"],
              },
            },
          },
        },
      },
    },
    orderBy: [
      {
        tasks: {
          _count: "desc",
        },
      },
    ],
  });

  // Sign all charity background images
  const charitiesWithSignedImages = await Promise.all(
    featuredCharities.map(async (charity) => {
      if (charity.backgroundPicture) {
        const signedUrl = await getSignedUrlForFile(
          charity.backgroundPicture,
          true,
        );
        return {
          ...charity,
          backgroundPicture: signedUrl || charity.backgroundPicture,
        };
      }
      return charity;
    }),
  );

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
  const novuAppId = process.env.NOVU_APP_ID;

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
      novuAppId,
      featuredCharities: charitiesWithSignedImages,
    };
  } else {
    return {
      tasks,
      userInfo,
      nextCursor,
      taskApplications: null,
      novuAppId,
      featuredCharities: charitiesWithSignedImages,
    };
  }
}

// ActiveFilters component to display and allow users to remove active filters
const ActiveFilters = ({
  filters,
  onRemoveFilter,
}: {
  filters: Record<string, string[]>;
  onRemoveFilter: (filterType: string, value: string) => void;
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
    updatedAt: "Updated",
  };

  // Helper to transform sort values to be more readable
  const formatSortValue = (filterType: string, value: string) => {
    if (["deadline", "createdAt", "updatedAt"].includes(filterType)) {
      return value === "asc" ? "Oldest first" : "Newest first";
    }
    return value;
  };

  // Get all active filters as {type, value} pairs
  const activeFilters = Object.entries(filters)
    .filter(([, values]) => values.length > 0 && values[0] !== "")
    .flatMap(([filterType, values]) =>
      values.map((value) => ({ type: filterType, value })),
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
    featuredCharities,
  } = useLoaderData<typeof loader>();
  const fetchTasks = useFetcher();
  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
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

  // Load initial tasks on component mount or when initialTasks changes
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
    fetchTasks.load(`/explore/tasks?${searchParams.toString()}`);
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
    setFilters((prevFilters) => {
      // If this is a single-select filter, clear it completely
      if (!["charity", "skills"].includes(filterType)) {
        return {
          ...prevFilters,
          [filterType]: [],
        };
      }

      // For multi-select filters, remove just the selected value
      return {
        ...prevFilters,
        [filterType]: prevFilters[filterType].filter((item) => item !== value),
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
      fetchTasks.load(`/explore/tasks?${searchParams.toString()}`);
    };

    // Check if filters have actual values to prevent unnecessary API calls
    const isFiltersEmpty = Object.values(filters).every(
      (property) => Array.isArray(property) && property.length === 0,
    );
    setShowClearFilters(!isFiltersEmpty);

    // Skip initial render - only trigger filter change on subsequent updates
    const filterChangeTimer = setTimeout(() => {
      handleFilterChange();
    }, 100);

    return () => clearTimeout(filterChangeTimer);
  }, [filters]);

  // Handle fetched data updates safely
  useEffect(() => {
    if (fetchTasks.data && Array.isArray(fetchTasks.data.tasks)) {
      if (isFilterChange) {
        setTasks(fetchTasks.data.tasks);
        setIsFilterChange(false);
      } else {
        setTasks((prev) =>
          Array.isArray(prev)
            ? [...prev, ...fetchTasks.data.tasks]
            : fetchTasks.data.tasks,
        );
      }
      setCursor(fetchTasks.data.nextCursor);
      setIsLoading(false);
    } else if (fetchTasks.data) {
      // Handle case where tasks isn't an array
      setTasks([]);
      setIsFilterChange(false);
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
      options={charityCategories}
      placeholder="Charity"
      onSelect={(option, selected) => onSelect(option, selected, "charity")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.charity}
      showSearch={true} // Enable search for charity categories
    />,
    <Dropdown
      key="skills"
      options={volunteeringSkills}
      placeholder="Skills"
      onSelect={(option, selected) => onSelect(option, selected, "skills")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.skills}
      showSearch={true} // Enable search for volunteering skills
    />,
    <Dropdown
      key="urgency"
      options={urgencyOptions}
      placeholder="Urgency"
      onSelect={(option, selected) => onSelect(option, selected, "urgency")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.urgency}
      showSearch={false} // Disable search for smaller lists
    />,
    <Dropdown
      key="status"
      options={statusOptions}
      placeholder="Status"
      onSelect={(option, selected) => onSelect(option, selected, "status")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.status}
      showSearch={false} // Disable search for smaller lists
    />,
    <Dropdown
      key="locationType"
      options={locationTypeOptions}
      placeholder="Location Type"
      onSelect={(option, selected) =>
        onSelect(option, selected, "locationType")
      }
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.locationType}
      showSearch={false} // Disable search for smaller lists
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
      showSearch={false} // Disable search for smaller lists
    />,
    <Dropdown
      key="deadline"
      options={["asc", "desc"]}
      placeholder="Deadline"
      onSelect={(option, selected) => onSelect(option, selected, "deadline")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.deadline}
      showSearch={false} // Disable search for smaller lists
    />,
    <Dropdown
      key="updatedAt"
      options={["asc", "desc"]}
      placeholder="Updated At"
      onSelect={(option, selected) => onSelect(option, selected, "updatedAt")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.updatedAt}
      showSearch={false} // Disable search for smaller lists
    />,
  ];
  return (
    <>
      <div className="m-auto lg:w-11/12 w-full p-4">
        <h1 className="mt-8 text-3xl lg:text-5xl font-semibold">
          Make a difference
        </h1>
        <p className="text-baseSecondary/70 mb-6">
          Help charities innovate and make a lasting impact{" "}
        </p>

        {/* Featured Charities Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 flex justify-between items-center">
            <span></span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const container = document.getElementById("charityCarousel");
                  if (container) {
                    container.scrollBy({ left: -300, behavior: "smooth" });
                  }
                }}
                className="p-2 rounded-full bg-white border border-basePrimaryLight/30 text-baseSecondary shadow-sm hover:bg-basePrimaryLight/10 transition-all"
                aria-label="Scroll left"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const container = document.getElementById("charityCarousel");
                  if (container) {
                    container.scrollBy({ left: 300, behavior: "smooth" });
                  }
                }}
                className="p-2 rounded-full bg-white border border-basePrimaryLight/30 text-baseSecondary shadow-sm hover:bg-basePrimaryLight/10 transition-all"
                aria-label="Scroll right"
              >
                <ArrowRight size={20} weight="bold" />
              </button>
            </div>
          </h2>
          <div className="relative">
            <div
              className="flex overflow-x-auto gap-4 pb-4 no-scrollbar"
              id="charityCarousel"
            >
              {featuredCharities && featuredCharities.length > 0 ? (
                featuredCharities.map((charity) => (
                  <div
                    key={charity.id}
                    className="min-w-[260px] w-[260px] flex-shrink-0 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white"
                  >
                    <a href={`/charity/${charity.id}`} className="block">
                      <div className="h-32 bg-gradient-to-r from-basePrimaryLight to-basePrimaryDark relative">
                        {charity.backgroundPicture ? (
                          <img
                            src={charity.backgroundPicture}
                            alt={charity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-3xl font-bold">
                              {charity.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-baseSecondary truncate">
                          {charity.name}
                        </h3>
                        <p className="text-sm text-basePrimaryDark line-clamp-2 h-10 mt-1">
                          {charity.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {charity.tags &&
                            charity.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-basePrimaryLight/30 text-baseSecondary rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          {charity._count?.tasks > 0 && (
                            <span className="text-xs px-2 py-1 bg-baseSecondary/10 text-baseSecondary rounded-full">
                              {charity._count.tasks} active{" "}
                              {charity._count.tasks === 1 ? "task" : "tasks"}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                ))
              ) : (
                <div className="w-full py-8 text-center text-basePrimaryDark">
                  No featured charities available at this time.
                </div>
              )}
            </div>
          </div>
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
          {tasks && tasks.length > 0
            ? tasks.map((task) => (
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
                  rewardAmount={task.rewardAmount}
                />
              ))
            : !isLoading && (
                <div className="w-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 text-basePrimaryDark">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      fill="currentColor"
                      viewBox="0 0 256 256"
                    >
                      <path
                        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v96H40Zm0,160V168H216v48Z"
                        opacity="0.2"
                      ></path>
                      <path d="M216,32H40A24,24,0,0,0,16,56V200a24,24,0,0,0,24,24H216a24,24,0,0,0,24-24V56A24,24,0,0,0,216,32Zm8,168a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V160H224ZM224,144H32V56a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8ZM48,184a8,8,0,0,1,8-8H80a8,8,0,0,1,0,16H56A8,8,0,0,1,48,184Zm128,0a8,8,0,0,1,8-8h24a8,8,0,0,1,0,16H184A8,8,0,0,1,176,184Z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-baseSecondary mb-2">
                    No tasks found
                  </h3>
                  <p className="text-basePrimaryDark max-w-md">
                    {Object.values(filters).some((values) => values.length > 0)
                      ? "Try adjusting your filters or check back later for new opportunities."
                      : "There are currently no volunteering opportunities available. Please check back later."}
                  </p>
                  {Object.values(filters).some(
                    (values) => values.length > 0,
                  ) && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-basePrimaryLight text-baseSecondary rounded-md hover:bg-basePrimaryDark transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}

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
            {cursor === null && !isLoading && tasks && tasks.length > 0 && (
              <p className="text-basePrimaryDark">No more tasks to load</p>
            )}
          </div>
        </div>
      </div>
      <div></div>
    </>
  );
}
