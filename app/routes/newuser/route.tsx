import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getZitadelVars } from "~/services/env.server";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  FormFieldFloating,
  FormTextarea,
  RadioOption,
  StyledTextarea,
} from "~/components/utils/FormField";
import { useEffect, useRef, useState } from "react";
import { getTags } from "~/components/utils/OptionsForDropdowns";
import FileUpload from "~/components/utils/FileUpload";
import { Meta, UppyFile } from "@uppy/core";
import { SecondaryButton } from "~/components/utils/BasicButton";
import { newUserForm } from "~/models/types.server";
import { createCharity } from "~/models/charities.server";
import { charities } from "@prisma/client";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken"); //retrieve access token from session to be used as bearer token

  if (!accessToken) {
    return redirect("/zitlogin");
  }
  const { userInfo, error } = await getUserInfo(accessToken);

  return { userInfo, error };
}

interface FormData {
  role: string;
  title: string;
  tags: string[];
  picture: string | undefined;
  bio: string;
  charityWebsite: string;
}

interface FormStep {
  id: string;
  title: string;
  component: React.FC<StepProps>;
}

interface StepProps {
  updateFields: (fields: Partial<FormData>) => void;
  formData: FormData;
}

const RoleSelectionStep: React.FC<StepProps> = ({ updateFields, formData }) => {
  const handleRoleChange = (role: string) => {
    updateFields({ role });
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-5xl text-center mb-2 ">Charity or Techie?</h1>
          <p className="text-center mb-6">
            Select the role that best describes you
          </p>
        </div>
        <RadioOption
          value="charity"
          label="Charity"
          isSelected={formData.role === "charity"}
          onChange={handleRoleChange}
          description="You intend to create tasks for techies to complete"
        />
        <RadioOption
          value="techie"
          label="Techie"
          isSelected={formData.role === "techie"}
          onChange={handleRoleChange}
          description="You intend to complete tasks charities create"
        />
      </div>
    </>
  );
};

const TitleStep: React.FC<StepProps> = ({ updateFields, formData }) => {
  return (
    <>
      <h1 className=" mb-6">
        {formData.role === "techie"
          ? "What's your job title?"
          : "What is the name of your charity?"}
      </h1>

      <FormFieldFloating
        onChange={(e) => updateFields({ title: e.target.value })}
        htmlFor={formData.title}
        placeholder={
          formData.role === "techie"
            ? "Enter your job title"
            : "Enter the name of your charity"
        }
        label={formData.role === "techie" ? "Job Title" : "Charity Name"}
      />
    </>
  );
};

const DescriptionStep: React.FC<StepProps> = ({ updateFields, formData }) => {
  return (
    <>
      <h1 className=" mb-6">
        {formData.role === "techie"
          ? "Describe your expertise"
          : "Describe your charity"}
      </h1>

      <FormTextarea
        autocomplete="off"
        htmlFor={formData.bio}
        maxLength={100}
        onChange={(e) => updateFields({ bio: e.target.value })}
        placeholder={
          formData.role === "techie"
            ? "Write a short description of your expertise and values"
            : "Write a short description of your charity"
        }
        value={formData.bio}
        label={
          formData.role === "techie" ? "Bio Description" : "Charity Description"
        }
      />
    </>
  );
};

const CharityWebsiteStep: React.FC<StepProps> = ({
  updateFields,
  formData,
}) => {
  return (
    <>
      <h1 className=" mb-6">What is the website for {formData.title}?</h1>

      <FormFieldFloating
        onChange={(e) => updateFields({ charityWebsite: e.target.value })}
        htmlFor={formData.charityWebsite}
        placeholder="Enter the link to your charity's website"
        label="Charity Website"
        type="url"
      />
    </>
  );
};

export const TagsStep: React.FC<StepProps> = ({ updateFields, formData }) => {
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
  if (formData.role === "techie") {
    tags = getTags("techSkills");
  } else {
    tags = getTags("charityTags");
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
        {formData.role === "techie"
          ? "List your tech skills"
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
                formData.role === "techie"
                  ? "Choose a skill"
                  : "Choose a category"
              }
            />

            <button
              type="button"
              onClick={() => addSkill(newSkill)}
              className="bg-baseSecondary text-basePrimaryLight px-4 rounded-r-md hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          {error && <span className="text-red-500 text-sm mt-1">{error}</span>}

          {isDropdownVisible && filteredSkills.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute left-0 w-full bg-white border rounded-lg border-baseSecondary mt-2 max-h-60 overflow-auto z-20 bg-basePrimaryLight"
            >
              {filteredSkills.map((skill, index) => (
                <li
                  key={index}
                  onClick={() => addSkill(skill)}
                  className="p-2 cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  {skill}
                </li>
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
                className="ml-2 text-xs bg-red-500 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors"
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

const PictureStep: React.FC<StepProps> = ({ updateFields, formData }) => {
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);
  const handleUploadedPicture = (
    successfullFiles: UppyFile<Meta, Record<string, never>>[],
  ) => {
    successfullFiles.map((upload) =>
      updateFields({ picture: upload.uploadURL }),
    );
  };
  const showFileUpload = () => {
    console.log("click");

    updateFields({ picture: undefined });
  };
  return (
    <>
      {!formData.picture && (
        <FileUpload
          uppyId="newUserPicture"
          formTarget="#uploadPicture"
          toggleUploadBtn={(toggle: boolean) => setShowUploadButton(toggle)}
          onUploadedFile={(
            successfullFiles: UppyFile<Meta, Record<string, never>>[],
          ) => handleUploadedPicture(successfullFiles)}
        />
      )}
      {formData.picture && (
        <div className="flex flex-row items-center justify-center gap-4">
          <div>
            <img
              src={formData.picture}
              alt="Profile Picture"
              className="w-24 h-24 rounded-full object-cover border-2 shadow-sm"
            />
          </div>
          <div>
            <SecondaryButton
              ariaLabel="choose another picture"
              text="Select Another"
              action={showFileUpload}
              type="button"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default function NewUserForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { userInfo, error } = useLoaderData<typeof loader>();

  const [formData, setFormData] = useState<FormData>({
    role: "",
    title: "",
    tags: [],
    picture: "",
    bio: "",
    charityWebsite: "",
  });

  const formSteps: FormStep[] =
    formData.role === "techie"
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
          { id: "picture", title: "Picture", component: PictureStep },
          { id: "tags", title: "tags", component: TagsStep },
        ]
      : [
          {
            id: "role",
            title: "Choose Your Role",
            component: RoleSelectionStep,
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
          { id: "charityTags", title: "tags", component: TagsStep },
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-baseSecondary">
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
                className="px-4 py-2 rounded-md transition-colors"
              >
                Back
              </button>
            )}
            {currentStep < formSteps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-baseSecondary text-basePrimaryLight rounded-md hover:bg-blue-700 transition-colors"
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
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-baseSecondary hover:bg-blue-700"
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
  const formData = await request.formData();
  const userId = formData.get("userId");
  const newUserInfo = formData.get("newUserInfo");
  const action = formData.get("_action");
  console.log(action);

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
  }

  //   if (typeof userId !== "string" || typeof role !== "string") {
  //     return { error: "Invalid input", status: 400 };
  //   }

  //   const updatedUser = await updateUserInfo(userId, newRole);
  //   console.log(updatedUser);

  return redirect("/dashboard");
};
