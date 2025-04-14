// TaskForm.tsx
import { Form } from "@remix-run/react";
import {
  FilePreviewButton,
  FormField,
  TextAreaField,
  ListInput,
  DropdownField,
} from "../utils/FormField";
import LocationInput, { LocationData } from "../utils/LocationInput";
import { charityTags, techSkills } from "../utils/OptionsForDropdowns";
import { CancelButton, PrimaryButton } from "../utils/BasicButton";
import { useEffect, useState } from "react";
import FileUpload from "../utils/FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import type { tasks, TaskUrgency } from "@prisma/client";
import { z } from "zod";
import Notification from "../cards/NotificationCard";

interface ValidationError {
  path: (string | number)[];
  message: string;
}

interface Resource {
  name: string;
  size: number;
  uploadURL: string;
  extension: string;
}

interface TaskFormData {
  title: string;
  description: string;
  resources: Resource[];
  requiredSkills: string[];
  impact: string;
  urgency: TaskUrgency;
  category: string[];
  deadline: string | Date;
  volunteersNeeded?: number;
  deliverables: string[];
  location?: LocationData | null;
}

interface TaskFormProps {
  initialData?: tasks | null;
  onSubmit: (formData: TaskFormData) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  error?: string;
  serverValidation: ValidationError[];
  isSubmitting: boolean;
  uploadURL: string;
  GCPKey?: string;
}

const defaultFormData: TaskFormData = {
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
  location: null,
};

export default function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  serverValidation = [],
  isSubmitting,
  uploadURL,
  GCPKey,
}: TaskFormProps) {
  // Initialize form data with initial data if provided
  const [formData, setFormData] = useState<TaskFormData>(() => {
    if (initialData) {
      return {
        title: initialData.title || "",
        description: initialData.description || "",
        impact: initialData.impact || "",
        requiredSkills: initialData.requiredSkills || [],
        category: initialData.category || [],
        urgency: initialData.urgency || "LOW",
        volunteersNeeded: initialData.volunteersNeeded || undefined,
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split("T")[0]
          : "",
        deliverables: initialData.deliverables || [],
        resources: initialData.resources || [],
        location: initialData.location
          ? {
              address: initialData.location.address || "",
              lat: initialData.location.lat || 0,
              lng: initialData.location.lng || 0,
            }
          : null,
      };
    }
    return defaultFormData;
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        impact: initialData.impact || "",
        requiredSkills: initialData.requiredSkills || [],
        category: initialData.category || [],
        urgency: initialData.urgency || "LOW",
        volunteersNeeded: initialData.volunteersNeeded || undefined,
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split("T")[0]
          : "",
        deliverables: initialData.deliverables || [],
        resources: initialData.resources || [],
        location: initialData.location
          ? {
              address: initialData.location.address || "",
              lat: initialData.location.lat || 0,
              lng: initialData.location.lng || 0,
            }
          : null,
      });
    }
  }, [initialData, isEditing]);

  const [uploadedResources, setUploadedResources] = useState<
    UppyFile<Meta, Record<string, never>>[]
  >(
    initialData?.resources?.map((resource) => ({
      name: resource.name,
      size: resource.size,
      uploadURL: resource.uploadURL,
      extension: resource.extension,
    })) || [],
  );
  const [showNotification, setShowNotification] = useState(false);
  const resetField = false;

  // Schema definitions
  const titleSchema = z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(50, "Title must be less than 50 characters");

  const impactSchema = z
    .string()
    .min(5, "Impact must be at least 5 characters")
    .max(80, "Impact must be less than 80 characters");

  // Handle file upload
  const handleUploadedResourcesUrls = (
    successfullFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    setUploadedResources((prevUploads) => [
      ...prevUploads,
      ...successfullFiles,
    ]);
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, resources: uploadedResources }));
  }, [uploadedResources]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRemoveItem = (inputField: string, input: string) => {
    switch (inputField) {
      case "skills":
        setFormData((prev) => ({
          ...prev,
          requiredSkills: prev.requiredSkills.filter((item) => item !== input),
        }));
        break;
      case "categories":
        setFormData((prev) => ({
          ...prev,
          category: prev.category.filter((item) => item !== input),
        }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Only proceed if not currently submitting
    if (!isSubmitting) {
      onSubmit(formData);
    }

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleFileDelete = async (file: string) => {
    console.log("File deleted", file);
    setUploadedResources((prev) =>
      prev.filter((resource) => resource.uploadURL !== file),
    );
    const res = await fetch(`/api/s3-get-url?file=${file}&action=delete`);
    const data = await res.json();
    console.log(data.message);

    console.log("Files after delete", uploadedResources);
  };

  const hasServerError = (fieldName: string) => {
    return serverValidation.some((error) => error.path[0] === fieldName);
  };

  useEffect(() => {
    console.log("Server validate", serverValidation);
  }, [serverValidation]);

  // Add location handling
  const handleLocationChange = (locationData: LocationData | null) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData,
    }));
  };

  return (
    <div className="max-w-full p-6 shadow-lg border border-basePrimaryDark rounded-lg relative">
      <Form
        method="post"
        onSubmit={handleSubmit}
        className="space-y-6"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // Prevent Enter key default action
          }
        }}
      >
        <h2 className="text-5xl mb-4 font-primary font-semibold text-baseSecondary">
          {isEditing ? "Edit Task" : "Create a Task"}
        </h2>

        <FormField
          htmlFor="title"
          label="Title"
          value={formData.title}
          onChange={handleChange}
          schema={titleSchema}
          helperText="Provide a title that best describes your task"
          serverValidationError={hasServerError("title")}
          resetField={resetField}
          placeholder="Enter a title"
          backgroundColour="bg-basePrimary"
        />

        <FormField
          htmlFor="impact"
          label="Impact"
          value={formData.impact}
          onChange={handleChange}
          schema={impactSchema}
          helperText="Provide the impact of your task"
          serverValidationError={hasServerError("impact")}
          resetField={resetField}
          placeholder="Enter the impact"
          backgroundColour="bg-basePrimary"
        />

        <TextAreaField
          htmlFor="description"
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          maxLength={500}
          minRows={3}
          maxRows={8}
          helperText="Provide a detailed description"
          schema={z
            .string()
            .min(10, "Description must be at least 10 characters")}
          placeholder="Enter a description"
          serverValidationError={hasServerError("description")}
          resetField={resetField}
        />

        {/* Skills Section */}
        <div className="flex-col flex w-full">
          <ListInput
            inputtedList={formData.requiredSkills}
            onInputsChange={(skills) =>
              setFormData((prev) => ({ ...prev, requiredSkills: skills }))
            }
            placeholder="Enter a technical Skill"
            availableOptions={techSkills}
            allowCustomOptions={false}
            useDefaultListStyling={false}
            helperText="List the skills necessary to complete this task"
            errorMessage="Provide at least one technical skill needed"
            inputLimit={4}
            serverValidationError={hasServerError("requiredSkills")}
            resetField={resetField}
            label="Skills"
            backgroundColour="bg-basePrimary"
          />

          <div className="flex flex-row gap-4 flex-wrap mt-2">
            {formData.requiredSkills.map((skill, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRemoveItem("skills", skill)}
                className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex-col flex w-full">
          <ListInput
            inputtedList={formData.category}
            onInputsChange={(categories) =>
              setFormData((prev) => ({ ...prev, category: categories }))
            }
            placeholder="Enter the charitable category"
            availableOptions={charityTags}
            allowCustomOptions={false}
            useDefaultListStyling={false}
            helperText="List the relevant charitable categories"
            errorMessage="Provide at least one category"
            inputLimit={2}
            serverValidationError={hasServerError("category")}
            resetField={resetField}
            label="Categories"
            backgroundColour="bg-basePrimary"
          />

          <div className="flex flex-row gap-4 flex-wrap mt-2">
            {formData.category.map((category, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRemoveItem("categories", category)}
                className="bg-basePrimaryDark p-2 font-primary rounded-md text-sm hover:bg-dangerPrimary hover:text-basePrimaryLight text-baseSecondary"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <FormField
          htmlFor="volunteers"
          value={String(formData.volunteersNeeded || "")}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              volunteersNeeded: e.target.value
                ? parseInt(e.target.value)
                : undefined,
            }))
          }
          min={1}
          max={50}
          isInteger={true} // This flag enables integer-specific validation
          backgroundColour="bg-basePrimary"
          placeholder="Enter the number of volunteers needed"
          helperText="Provide the number of volunteers needed"
          serverValidationError={hasServerError("volunteersNeeded")}
          resetField={resetField}
          label="Number of volunteers"
        />

        <DropdownField
          htmlFor="urgency"
          label="Urgency"
          value={formData.urgency}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, urgency: value as TaskUrgency }))
          }
          options={[
            { value: "LOW", label: "Low" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HIGH", label: "High" },
          ]}
          schema={z.enum(["LOW", "MEDIUM", "HIGH"])}
          helperText="Select the urgency level of this task"
          serverValidationError={hasServerError("urgency")}
          resetField={resetField}
          required
          backgroundColour="bg-basePrimary"
        />

        <DropdownField
          htmlFor="location"
          label="Task Location Type"
          value={
            formData.location
              ? "ONSITE"
              : formData.location === null
              ? "REMOTE"
              : "HYBRID"
          }
          onChange={(value) => {
            if (value === "REMOTE") {
              setFormData((prev) => ({ ...prev, location: null }));
            } else if (value === "ONSITE" && !formData.location) {
              // Only initialize an empty location if there isn't one already
              setFormData((prev) => ({
                ...prev,
                location: { address: "", lat: 0, lng: 0 },
              }));
            }
          }}
          options={[
            { value: "REMOTE", label: "Remote" },
            { value: "ONSITE", label: "On-site" },
            { value: "HYBRID", label: "Hybrid" },
          ]}
          schema={z.enum(["REMOTE", "ONSITE", "HYBRID"])}
          helperText="Select the location type for this task"
          serverValidationError={hasServerError("location")}
          resetField={resetField}
          required
          backgroundColour="bg-basePrimary"
        />

        {/* Only show location input if ONSITE or HYBRID is selected */}
        {formData.location !== null && (
          <LocationInput
            value={formData.location}
            onChange={handleLocationChange}
            label="Task Location"
            helperText="Enter the physical location for this task"
            serverValidationError={hasServerError("location")}
            required={formData.location !== null}
            backgroundColour="bg-basePrimary"
            GCPKey={GCPKey}
            
          />
        )}
        <FormField
          htmlFor="deadline"
          type="date"
          label="Deadline"
          value={
            typeof formData.deadline === "string"
              ? formData.deadline
              : new Date(formData.deadline).toISOString().split("T")[0]
          }
          onChange={handleChange}
          schema={z.date()}
          helperText="Provide the deadline for the task"
          serverValidationError={hasServerError("deadline")}
          resetField={resetField}
          placeholder="Enter task deadline"
          backgroundColour="bg-basePrimary"
        />

        <ListInput
          inputtedList={formData.deliverables}
          onInputsChange={(deliverables) =>
            setFormData((prev) => ({ ...prev, deliverables }))
          }
          placeholder="Enter a deliverable"
          allowCustomOptions={true}
          errorMessage="Provide the key deliverable(s)"
          serverValidationError={hasServerError("deliverables")}
          resetField={resetField}
          helperText="List the key deliverables"
          inputLimit={5}
          label="Deliverables"
          backgroundColour="bg-basePrimary"
        />

        {/* File Upload Section */}
        <div>
          <h2 className="text-lg font-semibold text-baseSecondary mb-4">
            Resources
          </h2>
          <FileUpload
            formTarget="#taskForm"
            uppyId={isEditing ? "editTaskResources" : "createTaskResources"}
            onUploadedFile={handleUploadedResourcesUrls}
            uploadURL={uploadURL}
          />

          {uploadedResources.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2 text-base">Uploaded Files</h3>
              <div className="flex flex-row flex-wrap gap-4 items-center">
                {uploadedResources.map((upload, index) => (
                  <>
                    <FilePreviewButton
                      key={index}
                      fileName={upload.name || null}
                      fileSize={upload.size}
                      fileUrl={upload.uploadURL || null}
                      fileExtension={upload.extension}
                      onDelete={handleFileDelete}
                      isEditing={true}
                    />
                  </>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 justify-end pt-6">
          <PrimaryButton
            text={isEditing ? "Save Changes" : "Create Task"}
            type="submit"
            ariaLabel="Submit task form"
          />
          {onCancel && (
            <CancelButton
              text="Cancel"
              action={onCancel}
              ariaLabel="Cancel task Form"
            />
          )}
        </div>
      </Form>

      {showNotification && (
        <div className="fixed top-4 right-4">
          {serverValidation.length > 0 ? (
            <Notification
              message={`Unable to ${isEditing ? "update" : "create"} task`}
              type="error"
            />
          ) : (
            <Notification
              message={`Task successfully ${isEditing ? "updated" : "created"}`}
              type="success"
            />
          )}
        </div>
      )}
    </div>
  );
}
