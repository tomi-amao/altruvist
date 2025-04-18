import React, { useEffect, useState } from "react";
import {
  Form,
  MetaFunction,
  useLoaderData,
  useActionData,
  useNavigation,
  useFetcher,
} from "@remix-run/react";
import { Avatar } from "~/components/cards/ProfileCard";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { deleteUser, getUserInfo, updateUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";
import {
  FormField,
  TextAreaField,
  ListInput,
} from "~/components/utils/FormField";
import { getTags, techSkills } from "~/components/utils/OptionsForDropdowns";
import FileUpload from "~/components/utils/FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import { SecondaryButton } from "~/components/utils/BasicButton";
import { Modal } from "~/components/utils/Modal2";
import { getCompanionVars, getFeatureFlags } from "~/services/env.server";
import { Alert } from "~/components/utils/Alert";
import { z } from "zod";
import { updateCharity } from "~/models/charities.server";
import { getSignedUrlForFile } from "~/services/s3.server";
import {
  Bell,
  Buildings,
  ShieldCheck,
  UserCircle,
  Warning,
} from "phosphor-react";

// Add this type definition at the top of the file
type ActionResponse = {
  success?: boolean;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

// Loader to fetch user data
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { userInfo } = await getUserInfo(accessToken, { charity: true });
  const { FEATURE_FLAG } = getFeatureFlags();
  const { COMPANION_URL } = getCompanionVars();

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  let signedProfilePicture;
  if (userInfo.profilePicture) {
    signedProfilePicture = await getSignedUrlForFile(
      userInfo.profilePicture,
      true,
    );
  }

  return { userInfo, signedProfilePicture, FEATURE_FLAG, COMPANION_URL };
}

// Replace the action function with this standardized version
export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const { userInfo, zitUserInfo } = await getUserInfo(
    session.get("accessToken"),
    { charity: true },
  );

  if (!userInfo) {
    return redirect("/zitlogin");
  }

  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    switch (action) {
      case "delete": {
        await deleteUser(userInfo.id, zitUserInfo.sub);
        return redirect("/zitlogout");
      }

      case "updateProfile": {
        const rawFormData = formData.get("formData") as string;
        const updateProfileData = JSON.parse(rawFormData);

        const updateFields = {
          ...updateProfileData,
          profilePicture:
            updateProfileData.profilePicture || userInfo.profilePicture,
        };

        const userSchema = z.object({
          name: z
            .string()
            .min(1, "Name is required")
            .max(80, "Maximum of 50 characters"),
          userTitle: z
            .string()
            .min(1, "Title is required")
            .max(50, "Maximum of 50 characters")
            .optional()
            .or(z.literal("")),
          bio: z
            .string()
            .min(1, "Bio is required")
            .max(1000)
            .optional()
            .or(z.literal("")),
          ...((userInfo.roles[0] === "volunteer" && {
            preferredCharities: z
              .array(z.string())
              .min(1, "At least one charity category is required"),
          }) ||
            {}),
          ...((userInfo.roles[0] === "volunteer" && {
            skills: z
              .array(z.string())
              .min(1, "At least one skill is required"),
          }) ||
            {}),
          profilePicture: z
            .string()
            .min(1, "Profile picture is required")
            .optional()
            .or(z.literal(null)),
        });

        const validationResult = userSchema.safeParse(updateFields);
        if (!validationResult.success) {
          const response: ActionResponse = {
            errors: validationResult.error.errors.map((err) => ({
              field: err.path[0]?.toString() || "unknown",
              message: err.message,
            })),
          };

          console.log("Error Response", response);

          return json(response, { status: 400 });
        }

        const { status } = await updateUserInfo(userInfo.id, updateFields);

        if (status !== 200) {
          return json(
            {
              errors: [{ field: "form", message: "Failed to update profile" }],
            },
            { status: 500 },
          );
        }

        return json({
          success: true,
          message: "Profile updated successfully",
        });
      }

      case "updateCharity": {
        const rawFormData = formData.get("formData") as string;
        const updateCharityData = JSON.parse(rawFormData);

        const charitySchema = z.object({
          name: z.string().min(1, "Charity name is required"),
          description: z.string().optional(),
          website: z
            .string()
            .regex(
              /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/,
              "Invalid website URL",
            )
            .optional()
            .or(z.literal("")),
          contactEmail: z
            .string()
            .email("Invalid email address")
            .optional()
            .or(z.literal("")),
          contactPerson: z.string().optional(),
          tags: z.array(z.string()).min(1, "At least one category is required"),
        });

        const validationResult = charitySchema.safeParse(updateCharityData);
        if (!validationResult.success) {
          const response: ActionResponse = {
            errors: validationResult.error.errors.map((err) => ({
              field: err.path[0]?.toString() || "unknown",
              message: err.message,
            })),
          };
          return json(response, { status: 400 });
        }

        const { status } = await updateCharity(
          userInfo.charity.id,
          updateCharityData,
        );

        if (status !== 200) {
          return json(
            {
              errors: [
                {
                  field: "form",
                  message: "Failed to update charity information",
                },
              ],
            },
            { status: 500 },
          );
        }

        return json({
          success: true,
          message: "Charity information updated successfully",
        });
      }

      default:
        return json(
          {
            errors: [{ field: "form", message: "Invalid action" }],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.log(`Error occurred in action ${action}`, error);

    return json(
      {
        errors: [{ field: "form", message: "An unexpected error occurred" }],
      },
      { status: 500 },
    );
  }
}

export const meta: MetaFunction = () => {
  return [{ title: "Account Settings" }];
};

export default function AccountSettings() {
  const { userInfo, FEATURE_FLAG, COMPANION_URL } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: userInfo?.name || "",
    userTitle: userInfo?.userTitle || "",
    bio: userInfo?.bio || "",
    skills: userInfo?.skills || [],
    profilePicture: userInfo?.profilePicture || "",
    preferredCharities: userInfo?.preferredCharities || [],
  });
  const [charityFormData, setCharityFormData] = useState({
    name: userInfo?.charity?.name || "",
    description: userInfo?.charity?.description || "",
    website: userInfo?.charity?.website || "",
    contactEmail: userInfo?.charity?.contactEmail || "",
    contactPerson: userInfo?.charity?.contactPerson || "",
    tags: userInfo?.charity?.tags || [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(null);

  const fetcher = useFetcher();
  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: <UserCircle weight="fill" size={24} />,
    },
    ...(FEATURE_FLAG
      ? [
          {
            id: "security",
            label: "Security",
            icon: <ShieldCheck weight="fill" size={24} />,
          },
        ]
      : []),
    ...(FEATURE_FLAG
      ? [
          {
            id: "notifications",
            label: "Notifications",
            icon: <Bell weight="fill" size={24} />,
          },
        ]
      : []),
    ...(userInfo?.roles?.includes("charity")
      ? [
          {
            id: "charity",
            label: "Charity",
            icon: <Buildings weight="fill" size={24} />,
          },
        ]
      : []),
    {
      id: "danger",
      label: "Danger Zone",
      icon: <Warning weight="fill" size={24} />,
    },
  ];

  useEffect(() => {
    async function fetchSignedUrl() {
      const res = await fetch(
        `/api/s3-get-url?file=${formData.profilePicture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setSignedProfilePicture(data.url);
      }
    }
    fetchSignedUrl();
  }, [formData.profilePicture]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSkillsChange = (skills: string[]) => {
    setFormData((prev) => ({
      ...prev,
      skills,
    }));
  };

  const handleUploadedPicture = (
    successfulFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    successfulFiles.map((upload) =>
      setFormData((prev) => ({
        ...prev,
        profilePicture: upload.uploadURL,
      })),
    );
  };

  const showFileUpload = () => {
    setFormData((prev) => ({
      ...prev,
      profilePicture: "",
    }));
  };

  const handleCharityInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCharityFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDeleteAccount = () => {
    fetcher.submit(
      { _action: "delete" },
      { method: "post", action: "/account/settings" },
    );
  };

  const ProfilePictureModal = () => {
    return (
      <div className="bg-basePrimary p-6 rounded-lg w-[480px]">
        <h3 className="text-xl text-baseSecondary mb-4">
          Change Profile Picture
        </h3>
        {!formData.profilePicture && (
          <FileUpload
            uppyId="profilePicture"
            formTarget="#uploadProfilePicture"
            onUploadedFile={handleUploadedPicture}
            uploadURL={COMPANION_URL}
          />
        )}
        {formData.profilePicture && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={signedProfilePicture || formData.profilePicture}
              className="w-32 h-32 rounded-full object-cover border-2 shadow-sm"
              alt={`${userInfo?.name}'s profile`}
            />
            <SecondaryButton
              ariaLabel="choose another picture"
              text="Choose Different Picture"
              action={showFileUpload}
              type="button"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-1/4">
          <div className="bg-basePrimary rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-4 mb-6 p-2">
              <Avatar
                src={signedProfilePicture || userInfo?.profilePicture}
                name={userInfo?.name}
                size={60}
              />
              <div className="break-words">
                <h3 className="text-baseSecondary font-medium">
                  {userInfo?.name}
                </h3>
                <p className="text-altMidGrey text-sm break-all">
                  {userInfo?.email}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors duration-200 flex items-center gap-3
              ${
                activeTab === tab.id
                  ? "bg-baseSecondary text-basePrimary"
                  : "text-baseSecondary hover:bg-basePrimaryLight"
              }`}
                >
                  <span
                    className={
                      activeTab === tab.id
                        ? "fill-basePrimary"
                        : "fill-baseSecondary"
                    }
                  >
                    {React.cloneElement(tab.icon as React.ReactElement, {
                      className:
                        activeTab === tab.id
                          ? "fill-basePrimary"
                          : "fill-baseSecondary",
                    })}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-basePrimary rounded-lg shadow-lg p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-primary text-baseSecondary border-b border-baseSecondary/20 pb-4">
                  Profile Settings
                </h2>
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="_action" value="updateProfile" />
                  <input
                    type="hidden"
                    name="formData"
                    value={JSON.stringify(formData)}
                  />

                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setIsModalOpen(true);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <img
                        src={
                          signedProfilePicture ||
                          formData.profilePicture ||
                          userInfo?.profilePicture
                        }
                        className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
                        alt={`${userInfo?.name}'s profile`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-basePrimaryDark/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-basePrimaryLight"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      htmlFor="name"
                      label="Full Name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      backgroundColour="bg-basePrimaryLight"
                      serverValidationError={
                        actionData?.errors?.some(
                          (error) => error.field === "name",
                        ) || false
                      }
                      helperText={
                        actionData?.errors?.find(
                          (error) => error.field === "name",
                        )?.message || undefined
                      }
                      schema={z.string().max(50)}
                    />

                    <FormField
                      htmlFor="userTitle"
                      label="Title"
                      type="text"
                      value={formData.userTitle}
                      onChange={handleInputChange}
                      backgroundColour="bg-basePrimaryLight"
                      helperText="Your professional title or role"
                      schema={z.string().max(50).optional()}
                    />

                    <div className="md:col-span-2">
                      <TextAreaField
                        htmlFor="bio"
                        label="Bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        backgroundColour="bg-basePrimaryLight"
                        maxLength={500}
                        minRows={4}
                        maxRows={8}
                        placeholder="Tell us about yourself"
                        serverValidationError={false}
                        resetField={false}
                      />
                    </div>

                    {userInfo?.roles?.includes("volunteer") && (
                      <div className="md:col-span-2">
                        <ListInput
                          inputtedList={formData.skills}
                          onInputsChange={handleSkillsChange}
                          placeholder="Add a skill"
                          label="Skills"
                          htmlFor="skills"
                          backgroundColour="bg-basePrimaryLight"
                          errorMessage="Please add at least one skill"
                          helperText={
                            actionData?.errors?.find(
                              (error) => error.field === "skills",
                            )?.message || "Add your skills"
                          }
                          serverValidationError={
                            actionData?.errors?.some(
                              (error) => error.field === "skills",
                            ) || false
                          }
                          resetField={false}
                          availableOptions={techSkills}
                          inputLimit={5}
                          allowCustomOptions={false}
                        />
                      </div>
                    )}

                    {userInfo?.roles?.includes("volunteer") && (
                      <div className="md:col-span-2">
                        <ListInput
                          inputtedList={formData.preferredCharities}
                          onInputsChange={(charities) =>
                            setFormData((prev) => ({
                              ...prev,
                              preferredCharities: charities,
                            }))
                          }
                          placeholder="Add a charity category"
                          label="Preferred Charity Categories"
                          htmlFor="preferredCharities"
                          backgroundColour="bg-basePrimaryLight"
                          errorMessage="Please add at least one preferred charity category"
                          helperText="Add categories of charities you're interested in"
                          serverValidationError={
                            actionData?.errors?.some(
                              (error) => error.field === "preferredCharities",
                            ) || false
                          }
                          resetField={false}
                          availableOptions={getTags("charityTags")}
                          inputLimit={5}
                          allowCustomOptions={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {actionData?.success && (
                      <p className="text-confirmPrimary">
                        ✓ {actionData.message}
                      </p>
                    )}
                    {actionData?.errors?.find((error) => error.field === "form")
                      ?.message && (
                      <p className="text-dangerPrimary">
                        ⚠{" "}
                        {
                          actionData.errors.find(
                            (error) => error.field === "form",
                          )?.message
                        }
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-baseSecondary text-basePrimary rounded-md transition-colors
                        ${
                          isSubmitting
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-baseSecondary/90"
                        }`}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </Form>

                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                >
                  <ProfilePictureModal />
                </Modal>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-primary text-baseSecondary border-b border-baseSecondary/20 pb-4">
                  Security Settings
                </h2>
                {/* Add security form content */}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-primary text-baseSecondary border-b border-baseSecondary/20 pb-4">
                  Notification Preferences
                </h2>
                {/* Add notification settings */}
              </div>
            )}

            {activeTab === "charity" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-primary text-baseSecondary border-b border-baseSecondary/20 pb-4">
                  Charity Information
                </h2>
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="_action" value="updateCharity" />
                  <input
                    type="hidden"
                    name="formData"
                    value={JSON.stringify(charityFormData)}
                  />

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
                      serverValidationError={
                        actionData?.errors?.some(
                          (error) => error.field === "name",
                        ) || false
                      }
                      schema={z.string().max(70)}
                    />

                    <FormField
                      htmlFor="website"
                      label="Website"
                      type="text"
                      value={charityFormData.website}
                      onChange={handleCharityInputChange}
                      backgroundColour="bg-basePrimaryLight"
                      helperText={
                        actionData?.errors?.find(
                          (error) => error.field === "website",
                        )?.message || "Official website of the charity"
                      }
                      // serverValidationError={actionData?.errors.some((error) => error.field === "website")}
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
                    />

                    <FormField
                      htmlFor="contactEmail"
                      label="Contact Email"
                      type="email"
                      value={charityFormData.contactEmail}
                      onChange={handleCharityInputChange}
                      backgroundColour="bg-basePrimaryLight"
                      helperText="Official contact email"
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
                        serverValidationError={false}
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
                          actionData?.errors?.find(
                            (error) => error.field === "tags",
                          )?.message ||
                          "Add categories that describe your charity"
                        }
                        // serverValidationError={actionData?.errors?.some((error) => error.field === "tags") || false}
                        resetField={false}
                        availableOptions={getTags("charityTags")}
                        inputLimit={5}
                        allowCustomOptions={false}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {actionData?.success && (
                      <p className="text-confirmPrimary">
                        ✓ Charity information updated successfully
                      </p>
                    )}
                    {actionData?.error && !actionData.field && (
                      <p className="text-dangerPrimary">
                        ⚠ {actionData.error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-baseSecondary text-basePrimary rounded-md transition-colors
                        ${
                          isSubmitting
                            ? "opacity-70 cursor-not-allowed"
                            : "hover:bg-baseSecondary/90"
                        }`}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </Form>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-primary text-baseSecondary border-b border-dangerPrimary/20 pb-4">
                  Danger Zone
                </h2>
                <div className="bg-dangerPrimary/10 p-4 rounded-md">
                  <h3 className="text-dangerPrimary font-medium mb-2">
                    Delete Account
                  </h3>
                  <p className="text-altMidGrey mb-4">
                    This action cannot be undone. Please be certain.
                  </p>
                  <button
                    onClick={() => setIsDeleteAlertOpen(true)}
                    className="px-4 py-2 bg-dangerPrimary text-basePrimary rounded-md hover:bg-dangerPrimary/90 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
                <Alert
                  isOpen={isDeleteAlertOpen}
                  onClose={() => setIsDeleteAlertOpen(false)}
                  title="Delete Account"
                  message="Are you sure you want to delete your account? This action cannot be undone."
                  confirmText="Delete Account"
                  onConfirm={handleDeleteAccount}
                  variant="danger"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
