import { LoaderFunctionArgs } from "@remix-run/node";
import { useState } from "react";
import TaskSummaryCard from "~/components/cards/taskCard";
import Navbar from "~/components/navigation/Header2";
import Header from "~/components/navigation/Header2";
import FormOptions from "~/components/utils/FormField";
import {
  taskCategoryFilterOptions,
  taskCharityFilterOptions,
} from "~/components/utils/OptionsForDropdowns";
import Dropdown from "~/components/utils/selectDropdown";

export default function Data() {
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [charityFilterSelected, setCharityFilterSelected] = useState({
    option: "Charity",
    id: 0,
  });

  const onSelect = (option: string) => {
    console.log("Selected action", option);
  };
  return (
    <>
      <Navbar />
      <div className="m-auto w-8/12  p-4 ">
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
            options={taskCharityFilterOptions}
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
        <div className="flex flex-row gap-2 flex-wrap">
          <TaskSummaryCard />
          <TaskSummaryCard />
          <TaskSummaryCard />
        </div>
      </div>
      <div></div>
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("Hello data");
  console.log(request.url);

  return {};
}
