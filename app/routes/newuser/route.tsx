import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
  useLoaderData,
} from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { commitSession, getSession } from "~/services/session.server";
import { getUserInfo, updateUserInfo } from "~/models/user2.server";
import {
  FormField,
  RadioOption,
  TextAreaField,
} from "~/components/utils/FormField";
import React, { useEffect, useRef, useState } from "react";
import { getTags } from "~/constants/dropdownOptions";
import FileUpload from "~/components/utils/FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import { SecondaryButton } from "~/components/utils/BasicButton";
import { createCharity } from "~/models/charities.server";
import { charities, users } from "@prisma/client";
import { getCompanionVars } from "~/services/env.server";

// Add the missing interface definition
interface newUserForm {
  role: string;
  title: string;
  tags: string[];
  picture?: string;
  bio: string;
  charityWebsite?: string;
  preferredCharities: string[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const isNew = session.get("isNew");
  const { COMPANION_URL } = getCompanionVars();

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  // Redirect non-new users to dashboard
  if (!isNew) {
    return redirect("/dashboard");
  }

  const { userInfo, error } = await getUserInfo(accessToken);

  return { userInfo, error, COMPANION_URL };
}

interface FormData {
  role: string;
  title: string;
  tags: string[];
  picture: string | undefined;
  bio: string;
  charityWebsite: string;
  preferredCharities: string[]; // Add this
}

interface FormStep {
  id: string;
  title: string;
  component: React.FC<StepProps>;
}

interface StepProps {
  updateFields: (fields: Partial<FormData>) => void;
  formData: FormData;
  uploadURL?: string;
}

const RoleSelectionStep = ({ updateFields, formData }: StepProps) => {
  const handleRoleChange = (role: string) => {
    updateFields({ role });
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-5xl text-center mb-2 ">Charity or Volunteer?</h1>
          <p className="text-center mb-6">
            Select the role that best describes you
          </p>
        </div>
        <RadioOption
          value="charity"
          label="Charity"
          isSelected={formData.role === "charity"}
          onChange={handleRoleChange}
          description="You intend to create tasks for volunteers to complete"
        />
        <RadioOption
          value="volunteer"
          label="Volunteer"
          isSelected={formData.role === "volunteer"}
          onChange={handleRoleChange}
          description="You intend to complete tasks charities create"
        />
      </div>
    </>
  );
};

const TitleStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className=" mb-6">
        {formData.role === "volunteer"
          ? "What's your profile title?"
          : "What is the name of your charity?"}
      </h1>

      <FormField
        onChange={(e) => updateFields({ title: e.target.value })}
        htmlFor={formData.title}
        placeholder={
          formData.role === "volunteer"
            ? "Enter your profile title"
            : "Enter the name of your charity"
        }
        label={formData.role === "volunteer" ? "Profile Title" : "Charity Name"}
        helperText="Your title is a short descriptor of yourself or expertise"
      />
    </>
  );
};

const DescriptionStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className=" mb-6">
        {formData.role === "volunteer"
          ? "Describe your expertise"
          : "Describe your charity"}
      </h1>

      <TextAreaField
        required
        helperText="Provide a brief description of your expertise"
        autocomplete="off"
        htmlFor={formData.bio}
        maxLength={200}
        onChange={(e) => updateFields({ bio: e.target.value })}
        placeholder={
          formData.role === "volunteer"
            ? "Write a short description of your expertise and values"
            : "Write a short description of your charity"
        }
        value={formData.bio}
        label={
          formData.role === "volunteer"
            ? "Bio Description"
            : "Charity Description"
        }
      />
    </>
  );
};

const CharityWebsiteStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className=" mb-6">What is the website for {formData.title}?</h1>

      <FormField
        onChange={(e) => updateFields({ charityWebsite: e.target.value })}
        htmlFor={formData.charityWebsite}
        placeholder="Enter the link to your charity's website"
        label="Charity Website"
        type="url"
      />
    </>
  );
};

export const TagsStep = ({ updateFields, formData }: StepProps) => {
  const [newSkill, setNewSkill] = useState("");
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  let tags = [];
  if (formData.role === "volunteer") {
    tags = getTags("volunteeringSkills");
  } else {
    tags = getTags("charityCategories");
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewSkill(value);
    setError("");

    if (value.trim() === "") {
      setFilteredSkills([]);
      setIsDropdownVisible(false);
    } else {
      const filtered = tags.filter(
        (skill) =>
          skill.toLowerCase().includes(value.toLowerCase()) &&
          !formData.tags.includes(skill),
      );
      setFilteredSkills(filtered);
      setIsDropdownVisible(true);
    }
  };

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill === "") return;

    if (!tags.includes(trimmedSkill)) {
      setError(`"${trimmedSkill}" is not a valid skill`);
      return;
    }
    if (!formData.tags.includes(trimmedSkill)) {
      updateFields({ tags: [...formData.tags, trimmedSkill] });
      setNewSkill("");
      setFilteredSkills([]);
      setIsDropdownVisible(false);
      setError("");
    } else {
      setError(`"${trimmedSkill}" is already added`);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    updateFields({
      tags: formData.tags.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(newSkill);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  return (
    <>
      <h1 className="text-5xl mb-6">
        {formData.role === "volunteer"
          ? "List your volunteering skills"
          : "List your charity's categories"}
      </h1>
      <div className="space-y-4">
        <div className="relative">
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              value={newSkill}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsDropdownVisible(true)}
              className="block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm bg-basePrimaryLight rounded-l-md border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300"
              placeholder={
                formData.role === "volunteer"
                  ? "Choose a skill"
                  : "Choose a category"
              }
            />

            <button
              type="button"
              onClick={() => addSkill(newSkill)}
              className="bg-baseSecondary text-basePrimaryLight px-4 rounded-r-md  transition-colors"
            >
              Add
            </button>
          </div>
          {error && (
            <span className="text-dangerPrimary text-sm mt-1">{error}</span>
          )}

          {isDropdownVisible && filteredSkills.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute left-0 w-full border rounded-lg border-baseSecondary mt-2 max-h-60 overflow-auto z-20 bg-basePrimaryLight"
            >
              {filteredSkills.map((skill, index) => (
                <button
                  key={index}
                  onClick={() => addSkill(skill)}
                  className="p-2 cursor-pointer hover:bg-accentPrimary transition-colors"
                >
                  {skill}
                </button>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.tags.map((skill, index) => (
            <span
              key={index}
              className="bg-baseSecondary text-basePrimaryLight px-3 py-1 rounded-full flex items-center"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 text-xs bg-dangerPrimary rounded-full w-4 h-4 flex items-center justify-center hover:bg-dangerPrimary transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

const PictureStep = ({ updateFields, formData, uploadURL }: StepProps) => {
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  const handleUploadedPicture = (
    successfulFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    successfulFiles.forEach((upload) =>
      updateFields({ picture: upload.uploadURL }),
    );
  };

  const showFileUpload = () => updateFields({ picture: undefined });
  useEffect(() => {
    async function fetchSignedUrl() {
      const res = await fetch(
        `/api/s3-get-url?file=${formData.picture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setSignedFileUrl(data.url);
      }
    }
    fetchSignedUrl();
  }, [formData.picture]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
      {!formData.picture && (
        <FileUpload
          uppyId="newUserPicture"
          formTarget="#uploadPicture"
          onUploadedFile={handleUploadedPicture}
          uploadURL={uploadURL!}
        />
      )}

      {formData.picture && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={signedFileUrl}
            className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
            alt="Profile Display"
          />
          <SecondaryButton
            ariaLabel="choose another picture"
            text="Select a different picture"
            action={showFileUpload}
            type="button"
          />
        </div>
      )}
    </div>
  );
};

const PreferredCharities = ({ updateFields, formData }: StepProps) => {
  const [newCategory, setNewCategory] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categories = getTags("charityCategories");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategory(value);
    setError("");

    if (value.trim() === "") {
      setFilteredCategories([]);
      setIsDropdownVisible(false);
    } else {
      const filtered = categories.filter(
        (category) =>
          category.toLowerCase().includes(value.toLowerCase()) &&
          !formData.preferredCharities.includes(category),
      );
      setFilteredCategories(filtered);
      setIsDropdownVisible(true);
    }
  };

  const addCategory = (category: string) => {
    const trimmedCategory = category.trim();
    if (trimmedCategory === "") return;

    if (!categories.includes(trimmedCategory)) {
      setError(`"${trimmedCategory}" is not a valid category`);
      return;
    }
    if (!formData.preferredCharities.includes(trimmedCategory)) {
      updateFields({
        preferredCharities: [...formData.preferredCharities, trimmedCategory],
      });
      setNewCategory("");
      setFilteredCategories([]);
      setIsDropdownVisible(false);
      setError("");
    } else {
      setError(`"${trimmedCategory}" is already added`);
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    updateFields({
      preferredCharities: formData.preferredCharities.filter(
        (category) => category !== categoryToRemove,
      ),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory(newCategory);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  return (
    <>
      <h1 className="text-5xl mb-6">
        {formData.role === "volunteer"
          ? "List your preferred charities"
          : "List your charity's categories"}
      </h1>
      <div className="space-y-4">
        <div className="relative">
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              value={newCategory}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsDropdownVisible(true)}
              className="block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm bg-basePrimaryLight rounded-l-md border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300"
              placeholder={
                formData.role === "volunteer"
                  ? "Choose a category"
                  : "Choose a category"
              }
            />

            <button
              type="button"
              onClick={() => addCategory(newCategory)}
              className="bg-baseSecondary text-basePrimaryLight px-4 rounded-r-md  transition-colors"
            >
              Add
            </button>
          </div>
          {error && (
            <span className="text-dangerPrimary text-sm mt-1">{error}</span>
          )}

          {isDropdownVisible && filteredCategories.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute left-0 w-full border rounded-lg border-baseSecondary mt-2 max-h-60 overflow-auto z-20 bg-basePrimaryLight"
            >
              {filteredCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => addCategory(category)}
                  className="p-2 cursor-pointer hover:bg-accentPrimary transition-colors"
                >
                  {category}
                </button>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {formData.preferredCharities.map((category, index) => (
            <span
              key={index}
              className="bg-baseSecondary text-basePrimaryLight px-3 py-1 rounded-full flex items-center"
            >
              {category}
              <button
                onClick={() => removeCategory(category)}
                className="ml-2 text-xs bg-dangerPrimary rounded-full w-4 h-4 flex items-center justify-center hover:bg-dangerPrimary transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </>
  );
};

export default function NewUserForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { userInfo, error, COMPANION_URL } = useLoaderData<typeof loader>();

  const [formData, setFormData] = useState<FormData>({
    role: "",
    title: "",
    tags: [],
    picture: "",
    bio: "",
    charityWebsite: "",
    preferredCharities: [], // Add this
  });

  const formSteps: FormStep[] =
    formData.role === "volunteer"
      ? [
          {
            id: "role",
            title: "Choose Your Role",
            component: RoleSelectionStep,
          },
          { id: "title", title: "Job Title", component: TitleStep },
          {
            id: "bioDescription",
            title: "Bio Description",
            component: DescriptionStep,
          },
          {
            id: "picture",
            title: "Picture",
            component: (props) => (
              <PictureStep {...props} uploadURL={COMPANION_URL} />
            ),
          },
          { id: "tags", title: "tags", component: TagsStep },
          {
            id: "preferredCharities",
            title: "Preferred Charities",
            component: PreferredCharities,
          },
        ]
      : [
          {
            id: "role",
            title: "Choose Your Role",
            component: RoleSelectionStep,
          },
          {
            id: "picture",
            title: "Picture",
            component: (props) => (
              <PictureStep {...props} uploadURL={COMPANION_URL} />
            ),
          },
          { id: "charityName", title: "Charity Name", component: TitleStep },
          {
            id: "charityDescription",
            title: "Charity Description",
            component: DescriptionStep,
          },
          {
            id: "charityWebsite",
            title: "Charity Website",
            component: CharityWebsiteStep,
          },
          { id: "charityCategories", title: "tags", component: TagsStep },
        ];

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const updateFields = (fields: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    console.log(formData);
  };

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, formSteps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const CurrentStepComponent = formSteps[currentStep].component;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && currentStep < formSteps.length - 1) {
      event.preventDefault();
      nextStep();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentStep < formSteps.length - 1) {
      nextStep();
    }
  };

  const handleFinalSubmit = (userId: string, newUserInfo: string) => {
    if (userId === "") {
      console.log("Session has no userId");

      return { message: "No userId provided. Please login." };
    }
    submit(
      { _action: "submit", userId, newUserInfo },
      { method: "POST", action: "/newuser" },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-baseSecondary bg-[radial-gradient(#B0B0B0_1px,transparent_1px)] [background-size:16px_16px]">
      <div>{error}</div>
      <div className="max-w-md w-full space-y-8 bg-basePrimaryLight p-8 rounded-xl shadow-lg">
        <Form
          method="post"
          className="space-y-6"
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
        >
          <CurrentStepComponent
            updateFields={updateFields}
            formData={formData}
          />

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded-md transition-colors text-baseSecondary"
              >
                Back
              </button>
            )}
            {currentStep < formSteps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-md transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleFinalSubmit(
                    userInfo?.id ?? "",
                    JSON.stringify(formData),
                  );
                }}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-basePrimaryLight font-semibold transition-colors ${
                  isSubmitting ? " cursor-not-allowed" : "bg-baseSecondary"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </Form>

        {actionData?.error && (
          <div className="mt-4 p-3 bg-dangerPrimary border border-dangerPrimary text-basePrimaryDark rounded">
            Error: {actionData.error}
          </div>
        )}
      </div>
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request);
  const formData = await request.formData();
  const userId = formData.get("userId");

  const newUserInfo = formData.get("newUserInfo");
  const action = formData.get("_action");
  console.log(action);

  if (!userId) {
    return redirect("/zitlogin");
  }

  if (action !== "submit") {
    console.log(action);

    return { error: null };
  }
  console.log("Action", userId, newUserInfo);
  const data: newUserForm = JSON.parse(newUserInfo as string);
  if (!data) {
    return { message: "No data found", error: "400" };
  }
  if (data.role === "charity") {
    const charityData: Partial<charities> = {
      name: data.title,
      description: data.bio,
      website: data.charityWebsite,
      tags: data.tags,
    };
    const charity = await createCharity(charityData, userId as string);
    console.log(charity);
  } else if (data.role === "volunteer") {
    const volunteerData: Partial<users> = {
      bio: data.bio,
      skills: data.tags,
      preferredCharities: data.preferredCharities,
    };
    const addNewUserInfo = await updateUserInfo(
      userId.toString(),
      volunteerData,
    );
    console.log(addNewUserInfo);
  }

  const updatedUser = await updateUserInfo(userId?.toString(), {
    roles: [data.role],
    profilePicture: data.picture,
    userTitle: data.title,
  });
  console.log(updatedUser);

  // After successful form submission, remove the isNew flag
  session.unset("isNew");

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};
