import { Form, useNavigation, useSubmit } from "@remix-run/react";
import {
  FilePreviewButton,
  FormFieldFloating,
  FormTextarea,
  ListInput,
} from "./FormField";
import Dropdown from "./selectDropdown";
import {
  charityTags,
  requiredSkillsOptions,
  taskCharityCategories,
  techSkills,
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
  const [urgency, setUrgency] = useState<string>("");
  const [uploadedResources, setUploadedResources] = useState<
    UppyFile<Meta, Record<string, never>>[]
  >([]);
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";
  interface NewTaskFormData {
    title: string;
    description: string;
    requiredSkills: string[];
    impact: string;
    resources: UppyFile<Meta, Record<string, never>>[];
    category: string[];
    deadline: string;
    volunteersNeeded: number | null;
    urgency: string;
    deliverables: string[];
  }
  const [formData, setFormData] = useState<NewTaskFormData>({
    title: "",
    description: "",
    resources: [],
    requiredSkills: [],
    impact: "",
    urgency: "",
    category: [],
    deadline: "",
    volunteersNeeded: null,
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
    console.log("Skills", requiredSkills);
    console.log("Deliverables", formData.deliverables);
    setFormData({
      ...formData,
      urgency: urgency,
    });
  }, [requiredSkills, categories, urgency]);

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

  const handleSubmit = (): Record<string, never> => {
    submit(
      { _action: "createTask", formData: JSON.stringify(formData) },
      { action: "/task/create", method: "POST" },
    );
    return {};
  };

  return (
    <div className="max-w-3xl p-6  shadow-lg border  border-basePrimaryDark rounded-lg relative">
      <Form action="/task/create" method="post" className="" id="taskForm">
        <fieldset className="mb-6 flex flex-col gap-4">
          <legend className="text-5xl font-semibold mb-4 font-header tracking-wide text-baseSecondary ">
            Create a Task
          </legend>
          <FormFieldFloating
            htmlFor="title"
            placeholder="Enter the title of the task"
            type="string"
            label="Title"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.title}
          />
          <FormFieldFloating
            htmlFor="impact"
            placeholder="Describe the impact this task will have"
            type="string"
            label="Impact"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.impact}
          />
          <FormTextarea
            autocomplete="off"
            htmlFor="description"
            maxLength={100}
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
            />
          </div>

          <div className=" max-w-3xl flex-wrap -mt-2 ">
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

          <div className="flex-col flex w-2/5 -mt-4">
            <Dropdown
              multipleSelect={false}
              placeholder="Urgency"
              options={urgencyOptions}
              onSelect={(option) => {
                setUrgency(option);
                setFormData({
                  ...formData,
                  urgency: urgency,
                });
              }}
            />
          </div>

          <FormFieldFloating
            htmlFor="volunteers"
            placeholder="Volunteers needed"
            type="number"
            backgroundColour="bg-basePrimary"
            value={`${formData.volunteersNeeded}` || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                volunteersNeeded: e.target.value
                  ? parseInt(e.target.value)
                  : null,
              })
            }
          />

          <FormFieldFloating
            htmlFor="deadline"
            placeholder="Deadline for the task"
            type="date"
            label="Deadline"
            backgroundColour="bg-basePrimary"
            onChange={handleChange}
            value={formData.deadline}
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
          />
        </fieldset>
        <legend className="text-5xl font-semibold mb-4 font-header tracking-wide text-baseSecondary ">
          Resources
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
                  fileName={upload.name}
                  fileSize={upload.size}
                  fileUrl={upload.uploadURL}
                  fileExtension={upload.extension}
                />
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
