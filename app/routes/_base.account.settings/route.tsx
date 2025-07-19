import React, { useEffect, useState } from "react";
import {
  Form,
  MetaFunction,
  useLoaderData,
  useActionData,
  useNavigation,
  useFetcher,
} from "react-router";
import { Avatar } from "~/components/cards/ProfileCard";
import {
  FormField,
  TextAreaField,
  ListInput,
} from "~/components/utils/FormField";
import { getTags, volunteeringSkills } from "~/constants/dropdownOptions";
import FileUpload from "~/components/utils/FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import { SecondaryButton } from "~/components/utils/BasicButton";
import { Modal } from "~/components/utils/Modal2";
import { Alert } from "~/components/utils/Alert";
import { z } from "zod";
import { Bell, ShieldCheck, UserCircle, Warning } from "@phosphor-icons/react";

// Import the loader and action functions
import { loader } from "./loader";
import { action } from "./action";

export { loader, action };

export const meta: MetaFunction = () => {
  return [
    { title: "Account Settings | Altruvist" },
    {
      name: "description",
      content:
        "Manage your Altruvist account settings, including profile information, security preferences, and notification settings",
    },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "og:title", content: "Account Settings | Altruvist" },
    {
      name: "og:description",
      content:
        "Update your profile, manage security preferences, and customize notification settings",
    },
  ];
};

export default function AccountSettings() {
  const {
    userInfo,
    managedCharities,
    signedProfilePicture: initialSignedProfilePicture,
    FEATURE_FLAG,
    COMPANION_URL,
  } = useLoaderData<typeof loader>();

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
    walletPublicKey: userInfo?.walletPublicKey || "", // Add wallet public key
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteCharityAlertOpen, setIsDeleteCharityAlertOpen] =
    useState(false);
  const [signedProfilePicture, setSignedProfilePicture] = useState<
    string | null
  >(initialSignedProfilePicture || null);
  const [selectedCharityToDelete, setSelectedCharityToDelete] = useState<
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
    {
      id: "danger",
      label: "Danger Zone",
      icon: <Warning weight="fill" size={24} />,
    },
  ];

  useEffect(() => {
    async function fetchSignedUrl() {
      if (formData.profilePicture) {
        const res = await fetch(
          `/api/s3-get-url?file=${formData.profilePicture}&action=upload`,
        );
        const data = await res.json();
        if (data.url) {
          setSignedProfilePicture(data.url);
        }
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

  const handleDeleteAccount = () => {
    fetcher.submit({ _action: "delete" }, { method: "post" });
  };

  const handleDeleteCharity = (charityId: string) => {
    fetcher.submit({ _action: "deleteCharity", charityId }, { method: "post" });
    setIsDeleteCharityAlertOpen(false);
  };

  const openDeleteCharityConfirm = (charityId: string) => {
    setSelectedCharityToDelete(charityId);
    setIsDeleteCharityAlertOpen(true);
  };

  const ProfilePictureModal = () => {
    return (
      <div className="bg-basePrimary p-6 rounded-lg w-full">
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
        <div className="md:w-2/6">
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
                <p className="tex text-xs break-all">{userInfo?.email}</p>
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

                    {/* Wallet Public Key Field */}
                    <div className="md:col-span-2">
                      <FormField
                        htmlFor="walletPublicKey"
                        label="Solana Wallet Public Key (Optional)"
                        type="text"
                        value={formData.walletPublicKey}
                        onChange={handleInputChange}
                        backgroundColour="bg-basePrimaryLight"
                        helperText="Enter your Solana wallet public key to receive token rewards for completed tasks"
                        placeholder="Enter your Solana wallet public key (e.g., 11111111111111111111111111111111)"
                        schema={z.string().optional()}
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
                          availableOptions={volunteeringSkills}
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
                          availableOptions={getTags("charityCategories")}
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
                        ⚠
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

                {managedCharities.length > 0 && (
                  <div className="bg-dangerPrimary/10 p-4 rounded-md">
                    <h3 className="text-dangerPrimary font-medium mb-2">
                      Delete Charities
                    </h3>
                    <p className="text-altMidGrey mb-4">
                      This action cannot be undone. Please be certain.
                    </p>
                    <ul className="space-y-4">
                      {managedCharities.map((charity) => (
                        <li
                          key={charity.id}
                          className="flex justify-between items-center"
                        >
                          <span className="text-baseSecondary">
                            {charity.name}
                          </span>
                          <button
                            onClick={() => openDeleteCharityConfirm(charity.id)}
                            className="px-4 py-2 bg-dangerPrimary text-basePrimary rounded-md hover:bg-dangerPrimary/90 transition-colors"
                          >
                            Delete Charity
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Alert
                  isOpen={isDeleteCharityAlertOpen}
                  onClose={() => setIsDeleteCharityAlertOpen(false)}
                  title="Delete Charity"
                  message="Are you sure you want to delete this charity? This action cannot be undone."
                  confirmText="Delete Charity"
                  onConfirm={() =>
                    handleDeleteCharity(selectedCharityToDelete!)
                  }
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
