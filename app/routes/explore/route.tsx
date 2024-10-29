import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TaskSummaryCard from "~/components/cards/taskCard";
import Navbar from "~/components/navigation/Header2";
import {
  taskCategoryFilterOptions,
  taskCharityCategories,
} from "~/components/utils/OptionsForDropdowns";
import Dropdown from "~/components/utils/selectDropdown";
import { getAllTasks } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { allTasks } = await getAllTasks();
  if (!accessToken) {
    return { allTasks, message: "No access token found", userInfo: null };
  }
  const { userInfo } = await getUserInfo(accessToken);

  console.log("First", allTasks);

  return { allTasks, userInfo };
}

export default function Explore() {
  const onSelect = (option: string) => {
    console.log("Selected action", option);
  };

  const { allTasks, userInfo } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar isLoggedIn={userInfo?.id ? true : false} />
      <div className="m-auto lg:w-8/12  w-full p-4  ">
        <h1 className="mt-16"> Make a difference </h1>
        <h2> Help charities innovate and make a lasting impact </h2>
        <div className="flex flex-row gap-4  border-b-2 border-b-baseSecondary p-4">
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
        </div>
        <div className="flex flex-row gap-2">
          <Dropdown
            options={taskCharityCategories}
            placeholder="Charity"
            onSelect={onSelect}
            multipleSelect={true}
          />
          <Dropdown
            options={taskCategoryFilterOptions}
            placeholder="Category"
            onSelect={onSelect}
            multipleSelect={true}
          />
        </div>
        <div className="flex flex-row gap-2 flex-wrap m-auto w-full justify-center">
          {allTasks?.map((task) => (
            <TaskSummaryCard
              key={task.id}
              title={task.title}
              category={task.category}
              deadline={new Date(task.deadline)}
              description={task.description}
              volunteersNeeded={task?.volunteersNeeded}
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
            />
          ))}
        </div>
      </div>
      <div></div>
    </>
  );
}
