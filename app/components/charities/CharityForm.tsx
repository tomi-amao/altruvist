import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  FormField,
  TextAreaField,
  ListInput,
} from "~/components/utils/FormField";
import { PrimaryButton, SecondaryButton } from "~/components/utils/BasicButton";
import { getTags } from "~/constants/dropdownOptions";
import FileUpload from "~/components/utils/FileUpload";
import { Image } from "@phosphor-icons/react";

interface CharityFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    website: string;
    contactEmail: string;
    contactPerson: string;
    tags: string[];
    backgroundPicture: string;
  };
  onSubmit?: (formData: CharityFormData) => void;
  onCancel?: () => void;
  uploadURL?: string;
  isSubmitting?: boolean;
  serverValidationErrors?: Array<{ field: string; message?: string }>;
  COMPANION_URL?: string;
}

interface CharityFormData {
  name: string;
  description: string;
  website: string;
  contactEmail: string;
  contactPerson: string;
  tags: string[];
  backgroundPicture: string;
  [key: string]: string | string[];
}

export default function CharityForm({
  initialData = {
    name: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPerson: "",
    tags: [],
    backgroundPicture: "",
  },
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverValidationErrors = [],
  COMPANION_URL,
}: CharityFormProps) {
  const [charityFormData, setCharityFormData] = useState<CharityFormData>({
    name: initialData.name || "",
    description: initialData.description || "",
    website: initialData.website || "",
    contactEmail: initialData.contactEmail || "",
    contactPerson: initialData.contactPerson || "",
    tags: initialData.tags || [],
    backgroundPicture: initialData.backgroundPicture || "",
  });

  const [backgroundPicturePreview, setBackgroundPicturePreview] = useState<
    string | undefined
  >(initialData.backgroundPicture);

  // Check if there's an error for a specific field
  const getFieldError = (fieldName: string) => {
    return serverValidationErrors?.find((error) => error.field === fieldName)
      ?.message;
  };

  const hasFieldError = (fieldName: string) => {
    return (
      serverValidationErrors?.some((error) => error.field === fieldName) ||
      false
    );
  };

  // Handle input changes
  const handleCharityInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCharityFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle file upload for background picture
  const handleUploadedBackgroundPicture = (
    successfulFiles: Array<{ uploadURL: string }>,
  ) => {
    successfulFiles.map((upload) =>
      setCharityFormData((prev) => ({
        ...prev,
        backgroundPicture: upload.uploadURL,
      })),
    );
  };

  // Show file upload instead of preview
  const showFileUpload = () => {
    setCharityFormData((prev) => ({
      ...prev,
      backgroundPicture: "",
    }));
  };

  // Fetch signed URL for background picture
  useEffect(() => {
    async function fetchSignedUrl() {
      if (!charityFormData.backgroundPicture) return;

      const res = await fetch(
        `/api/s3-get-url?file=${charityFormData.backgroundPicture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setBackgroundPicturePreview(data.url);
      }
    }
    fetchSignedUrl();
  }, [charityFormData.backgroundPicture]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(charityFormData);
    }
  };

  return (
    <div className="space-y-6">
      <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
        <input type="hidden" name="_action" value="updateCharity" />
        {initialData.id && (
          <input type="hidden" name="charityId" value={initialData.id} />
        )}
        <input
          type="hidden"
          name="formData"
          value={JSON.stringify(charityFormData)}
        />

        {/* Charity Background Picture Upload Section */}
        <div className="p-4 bg-basePrimaryLight rounded-lg mb-4">
          <h3 className="text-lg font-medium text-baseSecondary mb-3 flex items-center gap-2">
            <Image size={20} weight="fill" />
            Background Picture
          </h3>

          {charityFormData.backgroundPicture ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full h-48 rounded-lg overflow-hidden border border-baseSecondary/20">
                <img
                  src={
                    backgroundPicturePreview ||
                    charityFormData.backgroundPicture
                  }
                  alt="Charity Background"
                  className="w-full h-full object-cover"
                />
              </div>
              <SecondaryButton
                ariaLabel="choose another picture"
                text="Choose Different Picture"
                action={showFileUpload}
                type="button"
              />
            </div>
          ) : (
            <div>
              <p className="text-baseSecondary/70 mb-4">
                Upload a background image for your charity's profile
              </p>
              <FileUpload
                uppyId="charityBackground"
                formTarget="#uploadCharityBackground"
                onUploadedFile={handleUploadedBackgroundPicture}
                uploadURL={COMPANION_URL}
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            htmlFor="name"
            label="Charity Name"
            type="text"
            value={charityFormData.name}
            onChange={handleCharityInputChange}
            required
            backgroundColour="bg-basePrimaryLight"
            helperText="Official name of your charity"
            serverValidationError={hasFieldError("name")}
            schema={z.string().max(70)}
          />

          <FormField
            htmlFor="website"
            label="Website"
            type="text"
            value={charityFormData.website}
            onChange={handleCharityInputChange}
            backgroundColour="bg-basePrimaryLight"
            helperText="Official website of the charity"
            serverValidationError={hasFieldError("website")}
            schema={z
              .string()
              .regex(
                /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/,
                "Invalid website URL",
              )
              .optional()
              .or(z.literal(""))}
          />

          <FormField
            htmlFor="contactPerson"
            label="Contact Person"
            type="text"
            value={charityFormData.contactPerson}
            onChange={handleCharityInputChange}
            backgroundColour="bg-basePrimaryLight"
            helperText="Main contact person for the charity"
            serverValidationError={hasFieldError("contactPerson")}
          />

          <FormField
            htmlFor="contactEmail"
            label="Contact Email"
            type="email"
            value={charityFormData.contactEmail}
            onChange={handleCharityInputChange}
            backgroundColour="bg-basePrimaryLight"
            helperText="Official contact email"
            serverValidationError={hasFieldError("contactEmail")}
            schema={z
              .string()
              .email("Invalid email address")
              .optional()
              .or(z.literal(""))}
          />

          <div className="md:col-span-2">
            <TextAreaField
              htmlFor="description"
              label="Description"
              value={charityFormData.description}
              onChange={handleCharityInputChange}
              backgroundColour="bg-basePrimaryLight"
              maxLength={1000}
              minRows={4}
              maxRows={8}
              placeholder="Describe your charity's mission and goals"
              serverValidationError={hasFieldError("description")}
              resetField={false}
            />
          </div>

          <div className="md:col-span-2">
            <ListInput
              inputtedList={charityFormData.tags}
              onInputsChange={(tags) =>
                setCharityFormData((prev) => ({ ...prev, tags }))
              }
              placeholder="Add a category"
              label="Charity Categories"
              htmlFor="tags"
              backgroundColour="bg-basePrimaryLight"
              errorMessage="Please add at least one category"
              helperText={
                getFieldError("tags") ||
                "Add categories that describe your charity"
              }
              serverValidationError={hasFieldError("tags")}
              resetField={false}
              availableOptions={getTags("charityCategories")}
              inputLimit={5}
              allowCustomOptions={false}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <SecondaryButton
              text="Cancel"
              action={onCancel}
              ariaLabel="Cancel"
              isDisabled={isSubmitting}
            />
          )}
          <PrimaryButton
            text={isSubmitting ? "Saving..." : "Save Changes"}
            type="submit"
            ariaLabel="Save charity information"
            isDisabled={isSubmitting}
          />
        </div>
      </Form>
    </div>
  );
}
