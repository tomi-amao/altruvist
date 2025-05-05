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

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const isNew = session.get("isNew");
  const { COMPANION_URL } = getCompanionVars();

  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo, error } = await getUserInfo(accessToken);
  if (userInfo?.roles[0]) {
    return redirect("/dashboard");
  }
  // Redirect non-new users to dashboard
  if (!isNew) {
    return redirect("/dashboard");
  }

  return { userInfo, error, COMPANION_URL };
}

interface FormData {
  // Common user profile data (Part 1)
  name: string;
  picture: string | undefined;
  bio: string;

  // Role-specific data (Part 2)
  role: string;
  title: string;
  tags: string[];
  charityWebsite: string;
  preferredCharities: string[];
  joinExistingCharity: boolean;
  backgroundPicture: string | undefined; // New field for charity background image
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
          <h1 className="text-lg font-semibold text-center mb-2 ">
            Charity or Volunteer?
          </h1>
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
      <h1 className=" text-lg font-semibold mb-6">
        {formData.role === "volunteer"
          ? "Give your profile a title"
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
        helperText={
          formData.role === "volunteer"
            ? "Your title is a short descriptor of yourself or expertise. Or something catchy"
            : "The name of your charity"
        }
      />
    </>
  );
};

const DescriptionStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className=" text-lg font-semibold mb-6">Describe yourself</h1>

      <TextAreaField
        required
        helperText="Provide a brief description of your expertise"
        autocomplete="off"
        htmlFor={formData.bio}
        maxLength={200}
        onChange={(e) => updateFields({ bio: e.target.value })}
        placeholder={"Enter a short bio about yourself"}
        value={formData.bio}
        label={"Description"}
      />
    </>
  );
};

const CharityWebsiteStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className="text-lg font-semibold mb-6">
        Where can we find {formData.title}?
      </h1>

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
      <h1 className="text-lg font-semibold mb-6">
        {formData.role === "volunteer"
          ? "List your volunteering skills"
          : "What type of charitable work do you do?"}
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

const CharityBackgroundPictureStep = ({
  updateFields,
  formData,
  uploadURL,
}: StepProps) => {
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);

  const handleUploadedBackground = (
    successfulFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    successfulFiles.forEach((upload) =>
      updateFields({ backgroundPicture: upload.uploadURL }),
    );
  };

  const showFileUpload = () => updateFields({ backgroundPicture: undefined });

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!formData.backgroundPicture) return;

      const res = await fetch(
        `/api/s3-get-url?file=${formData.backgroundPicture}&action=upload`,
      );
      const data = await res.json();
      if (data.url) {
        setSignedFileUrl(data.url);
      }
    }
    fetchSignedUrl();
  }, [formData.backgroundPicture]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Charity Background Image</h2>
      <p className="text-sm text-basePrimary mb-4">
        Upload a banner image that represents your charity. This will be
        displayed at the top of your charity page.
      </p>

      {!formData.backgroundPicture && (
        <FileUpload
          uppyId="charityBackgroundPicture"
          formTarget="#uploadBackground"
          onUploadedFile={handleUploadedBackground}
          uploadURL={uploadURL!}
        />
      )}

      {formData.backgroundPicture && (
        <div className="flex flex-col items-center gap-4">
          <img
            src={signedFileUrl}
            className="w-full h-32 object-cover rounded-lg border-2 shadow-sm"
            alt="Charity Background"
          />
          <SecondaryButton
            ariaLabel="choose another background image"
            text="Select a different image"
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
      <h1 className="text-lg font-semibold mb-6">
        {formData.role === "volunteer"
          ? "What type of charities do you prefer?"
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

// Universal profile components (Part 1)
const NameStep = ({ updateFields, formData }: StepProps) => {
  return (
    <>
      <h1 className="text-lg font-semibold mb-6">What's your name?</h1>
      <FormField
        onChange={(e) => updateFields({ name: e.target.value })}
        value={formData.name}
        htmlFor="name"
        placeholder="Enter your full name"
        label="Name"
        helperText="This is how you'll be known on the platform"
        required
      />
    </>
  );
};

const CharityOptionStep = ({ updateFields, formData }: StepProps) => {
  const handleOptionChange = (joinExisting: boolean) => {
    updateFields({ joinExistingCharity: joinExisting });
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-center">
            Create or Join?
          </h1>
          <p className="text-center mb-6">
            Would you like to create a new charity or join an existing one?
          </p>
        </div>
        <RadioOption
          value="create"
          label="Create a New Charity"
          isSelected={!formData.joinExistingCharity}
          onChange={() => handleOptionChange(false)}
          description="Start a new charity profile on our platform"
        />
        <RadioOption
          value="join"
          label="Join an Existing Charity"
          isSelected={formData.joinExistingCharity}
          onChange={() => handleOptionChange(true)}
          description="You'll be redirected to explore and join existing charities"
        />
      </div>
    </>
  );
};

export default function NewUserForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formPart, setFormPart] = useState(1); // Track which part of the form we're in (1 or 2)
  const { userInfo, error, COMPANION_URL } = useLoaderData<typeof loader>();
  const [isManuallySubmitting, setIsManuallySubmitting] = useState(false); // Renamed for clarity

  const [formData, setFormData] = useState<FormData>({
    name: userInfo?.name || "",
    picture: userInfo?.profilePicture || "",
    bio: userInfo?.bio || "",
    role: "",
    title: "",
    tags: [],
    charityWebsite: "",
    preferredCharities: [],
    joinExistingCharity: false,
    backgroundPicture: undefined,
  });

  // Part 1: Universal profile details
  const universalProfileSteps: FormStep[] = [
    { id: "name", title: "Name", component: NameStep },
    {
      id: "bioDescription",
      title: "Bio Description",
      component: DescriptionStep,
    },
    {
      id: "picture",
      title: "Profile Picture",
      component: (props) => (
        <PictureStep {...props} uploadURL={COMPANION_URL} />
      ),
    },
  ];

  // Part 2: Role-specific steps
  const getPartTwoSteps = (): FormStep[] => {
    // First step is always role selection
    const baseSteps = [
      {
        id: "role",
        title: "Choose Your Role",
        component: RoleSelectionStep,
      },
    ];

    // Add role-specific steps
    if (formData.role === "volunteer") {
      return [
        ...baseSteps,
        { id: "title", title: "Job Title", component: TitleStep },
        { id: "tags", title: "Skills", component: TagsStep },
        {
          id: "preferredCharities",
          title: "Preferred Charities",
          component: PreferredCharities,
        },
      ];
    } else if (formData.role === "charity") {
      const charitySteps = [
        ...baseSteps,
        {
          id: "charityOption",
          title: "Charity Option",
          component: CharityOptionStep,
        },
      ];

      // Only add these steps if user wants to create a new charity
      if (!formData.joinExistingCharity) {
        charitySteps.push(
          { id: "charityName", title: "Charity Name", component: TitleStep },
          {
            id: "charityWebsite",
            title: "Charity Website",
            component: CharityWebsiteStep,
          },
          { id: "charityCategories", title: "Categories", component: TagsStep },
          {
            id: "charityBackgroundPicture",
            title: "Charity Background Picture",
            component: (props) => (
              <CharityBackgroundPictureStep
                {...props}
                uploadURL={COMPANION_URL}
              />
            ),
          },
        );
      }

      return charitySteps;
    }

    // Default fallback
    return baseSteps;
  };

  // Get the current active steps based on the form part
  const activeSteps =
    formPart === 1 ? universalProfileSteps : getPartTwoSteps();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const updateFields = (fields: Partial<FormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...fields };

      // If role changed, update the part two steps
      if (fields.role && fields.role !== prev.role) {
        setCurrentStep(0); // Reset to first step of part 2
      }

      return newData;
    });
  };

  const nextStep = () => {
    const maxStep = activeSteps.length - 1;
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    } else if (formPart === 1) {
      // Move to part 2 and reset step counter
      setFormPart(2);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (formPart === 2) {
      // Move back to part 1 and set to the last step
      setFormPart(1);
      setCurrentStep(universalProfileSteps.length - 1);
    }
  };

  const CurrentStepComponent = activeSteps[currentStep]?.component;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      !(
        activeSteps[currentStep].id === "bioDescription" ||
        activeSteps[currentStep].id === "tags" ||
        activeSteps[currentStep].id === "preferredCharities"
      )
    ) {
      event.preventDefault();
      nextStep();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // If at the end of part 1, move to part 2
    if (formPart === 1 && currentStep === universalProfileSteps.length - 1) {
      setFormPart(2);
      setCurrentStep(0);
      return;
    }

    // If in part 2 but not at the end, move to next step
    if (currentStep < activeSteps.length - 1) {
      nextStep();
      return;
    }

    // If in the special case of joining existing charity at the last step
    if (
      formData.role === "charity" &&
      formData.joinExistingCharity &&
      currentStep === activeSteps.length - 1
    ) {
      handleFinalSubmit(userInfo?.id ?? "", JSON.stringify(formData));
      return;
    }

    // Final submission
    if (formPart === 2 && currentStep === activeSteps.length - 1) {
      handleFinalSubmit(userInfo?.id ?? "", JSON.stringify(formData));
    }
  };

  const handleFinalSubmit = (userId: string, newUserInfo: string) => {
    if (userId === "") {
      console.log("Session has no userId");
      return { message: "No userId provided. Please login." };
    }

    // Prevent double submissions by disabling the button immediately
    setIsManuallySubmitting(true);

    submit(
      { _action: "submit", userId, newUserInfo },
      { method: "POST", action: "/newuser" },
    );
  };

  // Check if the current step can proceed
  const canProceed = () => {
    // If we're on role selection step (first step of part 2), require a role to be selected
    if (formPart === 2 && currentStep === 0) {
      return formData.role !== "";
    }

    // Add any other step-specific validation here

    // For all other steps, allow proceeding
    return true;
  };

  // Check if we're at the final step to show submit button
  const isLastStep = () => {
    return formPart === 2 && currentStep === activeSteps.length - 1;
  };

  // Check if we're on the role selection step
  const isRoleSelectionStep = () => {
    return formPart === 2 && currentStep === 0;
  };

  // Display part indicator
  const renderPartIndicator = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${formPart === 1 ? "bg-baseSecondary" : "bg-basePrimary"}`}
          ></div>
          <div
            className={`w-3 h-3 rounded-full ${formPart === 2 ? "bg-baseSecondary" : "bg-basePrimary"}`}
          ></div>
        </div>
        <div className="ml-4 text-sm text-baseSecondary font-semibold">
          {formPart === 1 ? "Profile Details" : "Role Setup"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-baseSecondary bg-[radial-gradient(#B0B0B0_1px,transparent_1px)] [background-size:16px_16px]">
      <div>{error}</div>
      <div className="max-w-md w-full space-y-8 bg-basePrimaryLight p-8 rounded-xl shadow-lg">
        {renderPartIndicator()}

        <Form
          method="post"
          className="space-y-6"
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
        >
          {CurrentStepComponent && (
            <CurrentStepComponent
              updateFields={updateFields}
              formData={formData}
            />
          )}

          <div className="flex justify-between mt-6">
            {(currentStep > 0 || formPart > 1) && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 rounded-md transition-colors text-baseSecondary"
              >
                Back
              </button>
            )}

            {/* Part 1 completion button or final submit button */}
            {formPart === 1 &&
            currentStep === universalProfileSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setFormPart(2);
                  setCurrentStep(0);
                }}
                className="px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-md transition-colors"
              >
                Next: Role Setup
              </button>
            ) : isRoleSelectionStep() ? (
              // On role selection step, only show Next button that's disabled until a role is selected
              <button
                type="button"
                onClick={nextStep}
                disabled={!formData.role}
                className={`px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-md transition-colors ${
                  !formData.role ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
              </button>
            ) : isLastStep() ||
              (formData.role === "charity" &&
                formData.joinExistingCharity &&
                currentStep === getPartTwoSteps().length - 1) ? (
              // Show Submit button on last step
              <button
                type="button"
                onClick={() => {
                  handleFinalSubmit(
                    userInfo?.id ?? "",
                    JSON.stringify(formData),
                  );
                }}
                disabled={isSubmitting || isManuallySubmitting}
                className={`px-4 py-2 rounded-md text-basePrimaryLight font-semibold transition-colors ${
                  isSubmitting || isManuallySubmitting
                    ? "bg-baseSecondary/70"
                    : "bg-baseSecondary"
                }`}
              >
                {isSubmitting || isManuallySubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-basePrimaryLight"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            ) : (
              // Normal Next button for other steps
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-md transition-colors ${
                  !canProceed() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
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
  const data = JSON.parse(newUserInfo as string);
  if (!data) {
    return { message: "No data found", error: "400" };
  }

  // If user chooses to join an existing charity, redirect them to the explore charities page
  if (data.role === "charity" && data.joinExistingCharity) {
    // Update minimal user information first
    await updateUserInfo(userId?.toString(), {
      name: data.name,
      bio: data.bio,
      profilePicture: data.picture,
      roles: [data.role],
    });

    // Remove the isNew flag
    session.unset("isNew");

    // Redirect to explore charities page
    return redirect("/explore/charities", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Handle normal flow based on role
  if (data.role === "charity" && !data.joinExistingCharity) {
    const charityData: Partial<charities> = {
      name: data.title,
      description: data.bio,
      website: data.charityWebsite,
      tags: data.tags,
      backgroundPicture: data.backgroundPicture,
    };

    // Create the charity and automatically set up charity membership
    const { charity } = await createCharity(charityData, userId as string);
    console.log(charity);
  } else if (data.role === "volunteer") {
    const volunteerData: Partial<users> = {
      name: data.name,
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

  // Update common user information
  const updatedUser = await updateUserInfo(userId?.toString(), {
    roles: [data.role],
    profilePicture: data.picture,
    userTitle: data.title,
    name: data.name,
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
