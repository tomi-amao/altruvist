import { Form } from "@remix-run/react";
import { FormFieldFloating, FormTextArea } from "./FormField";
import Dropdown from "./selectDropdown";
import {
  requiredSkillsOptions,
  taskCharityCategories,
  urgencyOptions,
} from "./OptionsForDropdowns";
import { CancelButton, PrimaryButton } from "./BasicButton";
import { useEffect, useState } from "react";

export default function CreateTaskForm() {
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string>();
  useEffect(() => {
    console.log("Skills", requiredSkills);
  }, [requiredSkills]);

  const handleDropdownItems = (
    dropdown: string,
    option: string,
    selected: string,
  ) => {
    switch (dropdown) {
      case "skills":
        // if already selected, do not add to the array
        if (!selected) {
          setRequiredSkills([...requiredSkills, option]);
        } else {
          // remove already selected option from the array
          setRequiredSkills(
            requiredSkills.filter((element) => element !== option),
          );
        }
        break;
      case "categories":
        if (!selected) {
          setCategories([...categories, option]);
        } else {
          setCategories(categories.filter((option) => option !== option));
        }
        break;
      default:
        break;
    }
  };
  return (
    <Form
      action=""
      method="post"
      className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg"
    >
      <fieldset className="mb-6 flex flex-col gap-4">
        <legend className="text-xl font-semibold mb-4">Task Details</legend>
        <FormFieldFloating htmlFor="title" placeholder="Title" type="string" />
        <FormTextArea
          htmlFor="description"
          placeholder="Description"
          type="string"
        />
        <FormTextArea htmlFor="impact" placeholder="Impact" type="string" />
        <div className="flex-col flex w-2/5 ">
          <Dropdown
            multipleSelect={true}
            placeholder="Required Skills"
            options={requiredSkillsOptions}
            onSelect={(option, selected) => {
              handleDropdownItems("skills", option, selected);
            }}
          />
        </div>
        <div className=" max-w-3xl flex-wrap -mt-2">
          {requiredSkills && (
            <ul className="flex flex-row gap-4 flex-wrap ">
              {requiredSkills.map((skill, index) => (
                <li
                  className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm"
                  key={index}
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-col flex w-2/5 -mt-4">
          <Dropdown
            multipleSelect={true}
            placeholder="Project Category"
            options={taskCharityCategories}
            onSelect={(option, selected) => {
              handleDropdownItems("categories", option, selected);
            }}
          />
        </div>
        <input type="hidden" name="requiredSkills" value={requiredSkills} />

        <div className=" max-w-3xl flex-wrap -mt-2 ">
          {categories && (
            <ul className="flex flex-row gap-4 flex-wrap">
              {categories.map((category, index) => (
                <li
                  className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm"
                  key={index}
                >
                  {category}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input type="hidden" name="categories" value={categories} />

        <div className="flex-col flex w-2/5 -mt-4">
          <Dropdown
            multipleSelect={false}
            placeholder="Urgency"
            options={urgencyOptions}
            onSelect={(option) => {
              setUrgency(option);
            }}
          />
        </div>
        <input type="hidden" name="urgency" value={urgency} />
        <FormFieldFloating
          htmlFor="volunteers"
          placeholder="Volunteers needed"
          type="number"
        />
        <FormFieldFloating
          htmlFor="deliverables"
          placeholder="Expected Deliverables"
          type="string"
        />
        <FormFieldFloating
          htmlFor="deadline"
          placeholder="Deadline"
          type="date"
        />
      </fieldset>
      <div className="flex flex-row-reverse">
        <PrimaryButton
          text="Create Task"
          ariaLabel="create a task"
          name="_action"
          value="createTask"
        />
        <CancelButton
          text="Cancel"
          ariaLabel="Cancel create task"
          name="_action"
          value="cancelCreateTask"
        />
      </div>
    </Form>
  );
}
