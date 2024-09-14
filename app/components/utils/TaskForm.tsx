import { Form } from "@remix-run/react";
import { FormFieldFloating, FormTextArea } from "./FormField";
import Dropdown from "./selectDropdown";
import {
  requiredSkillsOptions,
  taskCharityCategories,
  urgencyOptions,
} from "./OptionsForDropdowns";
import { CancelButton, PrimaryButton, SecondaryButton } from "./BasicButton";
import { useEffect, useState } from "react";
import FileUpload from "./FileUpload";
import { log } from "console";
import { Meta, UppyFile } from "@uppy/core";

export default function CreateTaskForm() {
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string>();
  const [uploadedResources, setUploadedResources] = useState<
    UppyFile<Meta, Record<string, never>>[]
  >([]);
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);

  useEffect(() => {
    console.log("Skills", requiredSkills);
  }, [requiredSkills]);

  const handleUploadedResourcesUrls = (
    successfullFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    setUploadedResources((prevUploads) => [
      ...prevUploads,
      ...successfullFiles,
    ]);
  };
  useEffect(() => {
    console.log("Client Side Files uploaded", uploadedResources);
  }, [uploadedResources]);

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

  // render extension icon if not an image
  const imageExtension = (extension: string, url: string) => {
    switch (extension) {
      case "docx":
      case "doc":
        return "/doc.png";
      case "pdf":
        return "/pdf.png";
      case "xls":
        return "/xlsx.png";
      case "xlsx":
        return "/xlsx.png";
      case "ppt":
        return "/ppt.png";
      default:
        return url;
    }
  };
  return (
    <div className="max-w-3xl mx-auto p-6  shadow-lg rounded-lg relative">
      <Form action="" method="post" className="" id="taskForm">
        <fieldset className="mb-6 flex flex-col gap-4">
          <legend className="text-5xl font-semibold mb-4 font-header tracking-wide text-baseSecondary ">
            Task Details
          </legend>
          <FormFieldFloating
            htmlFor="title"
            placeholder="Title"
            type="string"
          />
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
        <legend className="text-5xl font-semibold mb-4 font-header tracking-wide text-baseSecondary ">
          Resources
        </legend>

        <input
          type="hidden"
          value={JSON.stringify(uploadedResources)}
          name="uploadedResources"
        />
      </Form>
      <Form id="uploadResources" className=" flex flex-col gap-3  ">
        <FileUpload
          formTarget="#uploadResources"
          uppyId="uploadResourceTask"
          onUploadedFile={(
            successfullFiles: UppyFile<Meta, Record<string, never>>[],
          ) => handleUploadedResourcesUrls(successfullFiles)}
          toggleUploadBtn={(toggle: boolean) => setShowUploadButton(toggle)}
        />
        {showUploadButton && (
          <SecondaryButton text="Upload" ariaLabel="upload task resources" />
        )}
      </Form>
      {uploadedResources.length > 0 && (
        <div className="pt-8">
          <h1> Uploaded </h1>
          <div id="uploaded-files" className="flex-row flex-wrap flex gap-4 items-center ">
            {uploadedResources.map((upload, index) => {
              return (
                <div className="flex flex-col">
                  <img
                    src={imageExtension(upload.extension, upload.uploadURL!)}
                    alt={upload.name}
                    style={{ maxWidth: "100px" }}
                  />
                  <p className="break-all bg-basePrimaryLight p-2 px-4 rounded-lg h-fit max-w-42 max-h-14 overflow-auto">
                    {upload.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-row-reverse pt-8">
        <PrimaryButton
          text="Create Task"
          ariaLabel="create a task"
          name="_action"
          value="createTask"
          form="taskForm"
        />
        <CancelButton
          text="Cancel"
          ariaLabel="Cancel create task"
          name="_action"
          value="cancelCreateTask"
        />
      </div>
    </div>
  );
}
