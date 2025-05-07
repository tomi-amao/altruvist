import { Form, useActionData, useNavigate } from "react-router";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { useState } from "react";
import { z } from "zod";
import {
  FilePreviewButton,
  FormField,
  ListInput,
  TextAreaField,
} from "~/components/utils/FormField";
import { PrimaryButton } from "~/components/utils/BasicButton";
import { createCharity } from "~/models/charities.server";
import { ArrowLeft } from "@phosphor-icons/react";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    throw redirect("/zitlogin");
  }

  return { userInfo };
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo } = await getUserInfo(accessToken);
  if (!userInfo) {
    throw redirect("/zitlogin");
  }

  if (!userInfo) {
    return { error: "You must be logged in to create a charity" };
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const website = formData.get("website") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const tagsString = formData.get("tags") as string;
  const backgroundPicture = formData.get("backgroundPicture") as string;

  // Parse tags from the hidden input (which contains JSON stringified array)
  let tags: string[] = [];
  try {
    if (tagsString) {
      tags = JSON.parse(tagsString);
    }
  } catch (error) {
    console.error("Error parsing tags:", error);
  }

  // Validate inputs
  const errors: { field: string; message: string }[] = [];

  if (!name) {
    errors.push({ field: "name", message: "Charity name is required" });
  }

  if (!description) {
    errors.push({ field: "description", message: "Description is required" });
  }

  if (
    website &&
    !website.match(/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+/)
  ) {
    errors.push({
      field: "website",
      message: "Please enter a valid website URL",
    });
  }

  if (contactEmail && !contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push({
      field: "contactEmail",
      message: "Please enter a valid email address",
    });
  }

  if (tags.length === 0) {
    errors.push({ field: "tags", message: "Please add at least one tag" });
  }

  if (errors.length > 0) {
    return {
      errors,
      values: {
        name,
        description,
        website,
        contactEmail,
        tags,
        backgroundPicture,
      },
    };
  }

  // Create charity
  const result = await createCharity(
    {
      name,
      description,
      website: website || undefined,
      contactEmail: contactEmail || undefined,
      tags,
      backgroundPicture: backgroundPicture || undefined,
    },
    userInfo.id,
  );

  if (!result.charity) {
    return { error: result.message };
  }

  return redirect(`/dashboard/charities`);
}

const nameSchema = z
  .string()
  .min(3, { message: "Charity name must be at least 3 characters" });
const descriptionSchema = z
  .string()
  .min(30, { message: "Description must be at least 30 characters" });
const websiteSchema = z
  .string()
  .url({ message: "Please enter a valid URL" })
  .or(z.string().length(0));
const emailSchema = z
  .string()
  .email({ message: "Please enter a valid email address" })
  .or(z.string().length(0));

export default function CreateCharityPage() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state management
  const [name, setName] = useState(actionData?.values?.name || "");
  const [description, setDescription] = useState(
    actionData?.values?.description || "",
  );
  const [website, setWebsite] = useState(actionData?.values?.website || "");
  const [contactEmail, setContactEmail] = useState(
    actionData?.values?.contactEmail || "",
  );
  const [tags, setTags] = useState<string[]>(actionData?.values?.tags || []);
  const [backgroundUploadPath, setBackgroundUploadPath] = useState<string>(
    actionData?.values?.backgroundPicture || "",
  );
  const [backgroundFileDetails, setBackgroundFileDetails] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  const handleBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Create a FormData object to send the file to your S3 upload API
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/s3-get-url?action=upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBackgroundUploadPath(data.uploadPath);
        setBackgroundFileDetails({
          name: file.name,
          size: file.size,
          type: file.type.split("/").pop() || "",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundUploadPath("");
    setBackgroundFileDetails(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/dashboard/charities")}
          className="flex items-center text-baseSecondary hover:text-accentPrimary transition-colors mr-4"
          aria-label="Back to charities"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-baseSecondary">
          Create a New Charity
        </h1>
      </div>

      <Form
        method="post"
        className="space-y-6"
        onSubmit={() => setIsSubmitting(true)}
      >
        <div>
          <FormField
            htmlFor="name"
            label="Charity Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter charity name"
            backgroundColour="bg-basePrimaryDark"
            schema={nameSchema}
            required
            serverValidationError={actionData?.errors?.some(
              (error) => error.field === "name",
            )}
          />
        </div>

        <div>
          <TextAreaField
            htmlFor="description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your charity's mission, goals, and how it helps the community..."
            backgroundColour="bg-basePrimaryDark"
            schema={descriptionSchema}
            required
            maxLength={1000}
            serverValidationError={actionData?.errors?.some(
              (error) => error.field === "description",
            )}
            resetField={false}
          />
        </div>

        <div>
          <FormField
            htmlFor="website"
            label="Website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your-charity-website.com"
            backgroundColour="bg-basePrimaryDark"
            schema={websiteSchema}
            helperText="Optional: Your charity's website URL"
            serverValidationError={actionData?.errors?.some(
              (error) => error.field === "website",
            )}
          />
        </div>

        <div>
          <FormField
            htmlFor="contactEmail"
            label="Contact Email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@your-charity.com"
            backgroundColour="bg-basePrimaryDark"
            schema={emailSchema}
            helperText="Optional: Email address for inquiries"
            serverValidationError={actionData?.errors?.some(
              (error) => error.field === "contactEmail",
            )}
          />
        </div>

        <div>
          <ListInput
            inputtedList={tags}
            onInputsChange={setTags}
            placeholder="Add tags (e.g., education, environment, healthcare)"
            errorMessage="Please add at least one tag"
            helperText="Tags help volunteers find your charity"
            serverValidationError={actionData?.errors?.some(
              (error) => error.field === "tags",
            )}
            resetField={false}
            label="Tags"
            required
            htmlFor="tags"
            backgroundColour="bg-basePrimaryDark"
          />
          <input type="hidden" name="tags" value={JSON.stringify(tags)} />
        </div>

        <div className="space-y-2">
          <label className="block text-baseSecondary font-medium mb-1">
            Background Image{" "}
            <span className="text-xs text-baseSecondary/70">(Optional)</span>
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="block w-full text-sm text-baseSecondary
              file:mr-4 file:py-2 file:px-4 file:rounded-md
              file:border-0 file:text-sm file:font-semibold
              file:bg-baseSecondary file:text-basePrimary
              hover:file:bg-baseSecondary/90"
          />

          {backgroundUploadPath && backgroundFileDetails && (
            <div className="space-y-2">
              <FilePreviewButton
                fileUrl={backgroundUploadPath}
                fileName={backgroundFileDetails?.name || null}
                fileSize={backgroundFileDetails?.size || null}
                fileExtension={backgroundFileDetails?.type || null}
                onDelete={handleRemoveBackground}
                isEditing={true}
              />
              <input
                type="hidden"
                name="backgroundPicture"
                value={backgroundUploadPath || ""}
              />
            </div>
          )}
        </div>

        <div className="mt-8">
          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            ariaLabel="Create charity"
            text={isSubmitting ? "Creating Charity..." : "Create Charity"}
          />
        </div>
      </Form>
    </div>
  );
}
