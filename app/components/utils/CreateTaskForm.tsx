import { Form, useFetcher, useSubmit } from "@remix-run/react";
import {
  FilePreviewButton,
  FormFieldFloating,
  FormFieldFloatingImproved,
  FormTextarea,
  IntegerInput,
  ListInput,
  TextAreaField,
} from "./FormField";
import Dropdown from "./selectDropdown";
import { charityTags, techSkills, urgencyOptions } from "./OptionsForDropdowns";
import { CancelButton, PrimaryButton } from "./BasicButton";
import { useEffect, useState } from "react";
import FileUpload from "./FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import { NewTaskFormData } from "~/models/types.server";
import { TaskUrgency } from "@prisma/client";
import { z } from "zod";
import Notification from "~/components/cards/NotificationCard";

export default function CreateTaskForm() {
  const [urgency, setUrgency] = useState<string>("");
  const [uploadedResources, setUploadedResources] = useState<
    UppyFile<Meta, Record<string, never>>[]
  >([]);
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);
  const [serverValidation, setServerValidation] = useState([]);
  const [resetField, setResetField] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const fetcher = useFetcher();
  console.log(showUploadButton);

  const [formData, setFormData] = useState<NewTaskFormData>({
    title: "",
    description: "",
    resources: [],
    requiredSkills: [],
    impact: "",
    urgency: "LOW",
    category: [],
    deadline: "",
    volunteersNeeded: undefined,
    deliverables: [],
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    console.log(formData);

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    setFormData({
      ...formData,
      urgency: urgency as TaskUrgency,
    });
  }, [urgency]);

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
    setFormData({ ...formData, resources: uploadedResources });
  }, [uploadedResources]);

  const handleRemoveItem = (inputField: string, input: string) => {
    switch (inputField) {
      case "skills":
        setFormData({
          ...formData,
          requiredSkills: formData.requiredSkills.filter(
            (item) => item !== input,
          ),
        });

        break;
      case "categories":
        setFormData({
          ...formData,
          category: formData.category.filter((item) => item !== input),
        });

        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (fetcher.data?.error) {
      setServerValidation(fetcher.data.error.map((item) => item.path[0]));
    } else if (!fetcher.data?.error) {
      handleResetField();
      setServerValidation([]);
    }
    console.log("Server validation", serverValidation);
  }, [fetcher.data]);
  const handleSubmit = (): Record<string, never> => {
    fetcher.submit(
      { _action: "createTask", formData: JSON.stringify(formData) },
      { action: "/api/task/create", method: "POST" },
    );

    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // hide notification after 3 seconds

    return {};
  };

  const handleResetField = () => {
    setFormData({
      title: "",
      description: "",
      resources: [],
      requiredSkills: [],
      impact: "",
      urgency: "LOW",
      category: [],
      deadline: "",
      volunteersNeeded: undefined,
      deliverables: [],
    });
    setResetField((pre) => !pre);
  };
  const titleSchema = z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(50, "Title must be less than 50 characters");
  const impactSchema = z
    .string()
    .min(5, "Impact must be at least 5 characters")
    .max(80, "Impact must be less than 80 characters");

  return (
    <div className="max-w-3xl p-6  shadow-lg border  border-basePrimaryDark rounded-lg relative">
      <Form action="/task/create" method="post" className="" id="taskForm">
        <fieldset className="mb-6 flex flex-col gap-4">
          <legend className="text-5xl  mb-4 font-header tracking-wide text-baseSecondary ">
            Create a Task
          </legend>

          {/* <p>{fetcher.data?.error.length}</p> */}
          {/* <FormFieldFloating
            htmlFor="title"
            placeholder="Enter the title of the task"
            type="string"
            label="Title"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.title}
          /> */}
          <FormFieldFloatingImproved
            htmlFor="title"
            placeholder="Enter the title of the task"
            type="string"
            label="Title"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.title}
            schema={titleSchema}
            required
            helperText="Provide a title that best describes your task"
            serverValidationError={serverValidation.includes("title")}
            resetField={resetField}
          />

          {/* <FormFieldFloating
            htmlFor="impact"
            placeholder="Describe the impact this task will have"
            type="string"
            label="Impact"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.impact}
          /> */}

          <FormFieldFloatingImproved
            htmlFor="impact"
            placeholder="Enter the impact "
            type="string"
            label="Impact"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.impact}
            schema={impactSchema}
            required
            helperText="Provide the impact of your task"
            serverValidationError={serverValidation.includes("impact")}
            resetField={resetField}
          />

          {/* <FormTextarea
            autocomplete="off"
            htmlFor="description"
            maxLength={1000}
            placeholder="Describe the task"
            label="Description"
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            value={formData.description}
            backgroundColour="bg-basePrimary"
          /> */}

          <TextAreaField
            htmlFor="description"
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            maxLength={500}
            minRows={3}
            maxRows={8}
            helperText="Provide a detailed description describing what the task will involve doing "
            schema={z
              .string()
              .min(10, "Description must be at least 10 characters")}
            placeholder="Enter a description"
            serverValidationError={serverValidation.includes("description")}
            resetField={resetField}
            required
          />

          <div className="flex-col flex w-full ">
            <ListInput
              inputtedList={formData.requiredSkills}
              onInputsChange={(inputs) => {
                setFormData({
                  ...formData,
                  requiredSkills: inputs,
                });
                console.log(formData.requiredSkills);
              }}
              placeholder="Enter a required technical Skill"
              availableOptions={techSkills}
              allowCustomOptions={false}
              useDefaultListStyling={false}
              helperText="List the skills necessary to complete this task"
              errorMessage="Provide at least one technical skill needed"
              inputLimit={4}
              serverValidationError={serverValidation.includes(
                "requiredSkills",
              )}
              resetField={resetField}
            />
          </div>
          <div className=" max-w-3xl flex-wrap -mt-2 mb-2">
            {formData.requiredSkills && (
              <ul className="flex flex-row gap-4 flex-wrap ">
                {formData.requiredSkills.map((skill, index) => (
                  <button
                    className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
                    key={index}
                    onClick={() => {
                      handleRemoveItem("skills", skill);
                    }}
                  >
                    {skill}
                  </button>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-col flex w-full -mt-4">
            <ListInput
              inputtedList={formData.category}
              onInputsChange={(inputs) => {
                setFormData({
                  ...formData,
                  category: inputs,
                });
                console.log(formData.category);
              }}
              placeholder="Enter the charitable category of the task"
              availableOptions={charityTags}
              allowCustomOptions={false}
              useDefaultListStyling={false}
              helperText="List the relevant charitable category the task falls under"
              errorMessage="Provide at least one charitable category for the task"
              serverValidationError={serverValidation.includes(
                "volunteersNeeded",
              )}
              inputLimit={2}
              resetField={resetField}
            />
          </div>

          <div className=" max-w-3xl flex-wrap -mt-4 ">
            {formData.category && (
              <ul className="flex flex-row gap-4 flex-wrap">
                {formData.category.map((category, index) => (
                  <button
                    className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
                    key={index}
                    onClick={() => {
                      handleRemoveItem("categories", category);
                    }}
                  >
                    {category}
                  </button>
                ))}
              </ul>
            )}
          </div>
          {/* <input type="hidden" name="categories" value={categories} /> */}

          {/* <div className="flex-col flex w-2/5 -mt-4">
            <Dropdown
              multipleSelect={false}
              placeholder="Urgency"
              options={urgencyOptions}
              onSelect={(option) => {
                setUrgency(option);
                setFormData({
                  ...formData,
                  urgency: urgency as TaskUrgency,
                });
              }}
            />
          </div> */}

          <IntegerInput
            htmlFor="volunteers"
            value={`${formData.volunteersNeeded}`}
            onChange={(e) =>
              setFormData({
                ...formData,
                volunteersNeeded: e.target.value
                  ? parseInt(e.target.value)
                  : undefined,
              })
            }
            min={1}
            max={50}
            backgroundColour="bg-basePrimary"
            placeholder="Enter the number of volunteers needed"
            helperText="Provide the number of volunteers needed to complete the task"
            serverValidationError={serverValidation.includes(
              "volunteersNeeded",
            )}
            resetField={resetField}
          />

          {/* <FormFieldFloating
            htmlFor="deadline"
            placeholder="Deadline for the task"
            type="date"
            label="Deadline"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.deadline}
          /> */}

          <FormFieldFloatingImproved
            htmlFor="deadline"
            placeholder="Deadline for the task"
            type="date"
            label="Deadline"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.deadline}
            schema={z.date()}
            required
            helperText="Provide the deadline for the task"
            serverValidationError={serverValidation.includes("deadline")}
            resetField={resetField}
          />
          <ListInput
            inputtedList={formData.deliverables}
            onInputsChange={(tags) => {
              setFormData({
                ...formData,
                deliverables: tags,
              });
              console.log(formData.deliverables);
            }}
            placeholder="Enter a deliverable"
            allowCustomOptions={false}
            errorMessage="Provide the key deliverable(s) that must be achieved"
            serverValidationError={serverValidation.includes("deliverables")}
            resetField={resetField}
            helperText="List the key deliverable for the task"
            inputLimit={5}
          />
        </fieldset>
        <legend className="text-5xl mb-4 font-header tracking-wide text-baseSecondary ">
          Upload Resources
        </legend>
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
      </Form>
      {uploadedResources.length > 0 && (
        <div className="pt-8">
          <h1> Uploaded </h1>
          <div
            id="uploaded-files"
            className="flex-row flex-wrap flex gap-4 items-center "
          >
            {uploadedResources.map((upload, index) => {
              return (
                <FilePreviewButton
                  key={index}
                  fileName={upload.name || null}
                  fileSize={upload.size}
                  fileUrl={upload.uploadURL || null}
                  fileExtension={upload.extension}
                />
              );
            })}
          </div>
        </div>
      )}

      {showNotification && (
        <div>
          {" "}
          {serverValidation.length > 0 ? (
            <Notification message="Unable to create task" type="error" />
          ) : (
            <Notification message="Task successfully created" type="success" />
          )}
        </div>
      )}
      <div className="flex flex-row-reverse pt-8">
        <PrimaryButton
          text="Create Task"
          ariaLabel="create a task"
          name="_action"
          value="createTask"
          form="taskForm"
          type="button"
          action={handleSubmit}
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
