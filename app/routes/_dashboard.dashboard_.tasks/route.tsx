import { useState } from "react";
import {
  PrimaryButton,
  SecondaryButton,
} from "../../components/utils/BasicButton";
import DashboardBanner, {
  BannerItem,
} from "~/components/cards/BannerSummaryCard";
import Dropdown from "~/components/utils/selectDropdown";
import { statusOptions } from "~/components/utils/OptionsForDropdowns";
import { FormFieldFloating } from "~/components/utils/FormField";

type Task = {
  id: number;
  title: string;
  deadline: string;
  timeLeft: string;
  charity: string;
  type: string;
  description: string;
};

const tasks: Task[] = [
  {
    id: 1,
    title: "Deforestation levels",
    deadline: "12/04/2024",
    timeLeft: "2 weeks left",
    charity: "Standing Roots",
    type: "Task, Consulting",
    description:
      "We are an environmental charity needing help with data analysis. We need analysis of the following data attached to this task...",
  },
  {
    id: 2,
    title: "Young persons homelessness",
    deadline: "09/30/2024",
    timeLeft: "3 days left",
    charity: "Safe Haven",
    type: "Task, Advocacy",
    description:
      "Our charity is working on reducing homelessness amongst young people and we need volunteer assistance in gathering reports...",
  },
  {
    id: 3,
    title: "Rate of refugees",
    deadline: "10/05/2024",
    timeLeft: "8 days left",
    charity: "Global Support",
    type: "Task, Research",
    description:
      "We need support with research into the increasing rate of refugees in several countries...",
  },
];

const bannerItems: BannerItem[] = [
  {
    title: "Recommended Tasks",
    value: "Create a Fundraising Platform for Charity X",
  },
  { title: "Charities Helped", value: "8" },
];

const taskFiles = ["PDF", "PNG", "EXCEL"];

export default function TaskList() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0]);
  const [status, setStatus] = useState<string>();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full lg:min-h-screen p-4 -mt-10">
      <div className="lg:w-1/3 w-full p-4 shadow-md space-y-4 rounded-md border border-basePrimaryDark">
        <input
          type="text"
          placeholder="Search "
          className="w-full flex-grow p-2 bg-basePrimaryDark text-sm lg:text-base rounded"
        />
        <div className="flex mb-4 gap-4">
          <PrimaryButton ariaLabel="filter button" text="Filter" />
          <PrimaryButton ariaLabel="sort button" text="Sort" />
        </div>

        <ul className=" lg:space-y-0">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={` p-4 lg:p-2 border-b-[1px] hover:bg-baseSecondary hover:text-basePrimary rounded cursor-pointer lg:border-dashed ${
                selectedTask?.id === task.id
                  ? "bg-baseSecondary text-basePrimaryDark font-semibold"
                  : ""
              }`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="text-lg font-primary ">{task.title}</div>
              <div className="text-sm">{task.timeLeft}</div>
            </li>
          ))}
        </ul>
      </div>


      {selectedTask && (
        <div className="lg:w-2/3 w-full lg:ml-6  lg:mt-0 p-6 shadow-md rounded-md border border-basePrimaryDark">
          <DashboardBanner
            bannerItems={[
              { title: "Title", value: selectedTask.title },
              { title: "Deadline", value: selectedTask.deadline },
              { title: "Charity", value: selectedTask.charity },
              { title: "Type", value: selectedTask.type },
            ]}
          />

          <h1 className="text-base font-primary py-4">Description</h1>
          <p className="bg-basePrimaryDark rounded-md p-2 ">
            {selectedTask.description}
          </p>

          <div className="">
            <h1 className="font-primary text-base pt-4">Attachments</h1>
            <div className="flex gap-4 mt-2">
              {taskFiles.map((file) => (
                <SecondaryButton text={file} ariaLabel={file} />
              ))}
            </div>
          </div>

          <div className="">
            <h1 className="font-primary text-base pt-4">Status</h1>
            <div className="flex gap-4 mt-2">
              <Dropdown
                multipleSelect={false}
                placeholder="Select a status"
                options={statusOptions}
                onSelect={(option) => {
                  setStatus(option);
                }}
              />
            </div>
          </div>
          <div className="py-3 mt-6">
            <button className="px-4 py-2 bg-dangerPrimary text-basePrimaryDark rounded">
              Withdraw from task
            </button>
          </div>

          <div className="pt-2">
            <FormFieldFloating htmlFor="message" placeholder="Send a message to the charity" label="Message"/>
          </div>
        </div>
      )}
    </div>
  );
}
