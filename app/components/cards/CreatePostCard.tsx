import { Form, useNavigate, useNavigation } from "@remix-run/react";
import { Modal } from "../utils/Modal";
import FormOptions, {
  FormField,
  FormFieldFloating,
  FormTextArea,
} from "../utils/FormField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { tags } from "../utils/OptionsForDropdowns";

export default function CreatePostCard() {
  // manage form options state
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState({ option: "Select a Tag", id: 0 });

  const [options, setOptions] = useState(tags);

  const deleteTag = (option: string) => {
    const filteredTags = selectedOptions.filter((tag) => option !== tag);
    setSelectedOptions(filteredTags);
  };

  const [option, setOption] = useState<{ id: number; option: string }>();
  const selectedTags = (
    selectedOption: SetStateAction<{ id: number; option: string } | undefined>,
  ) => {
    setOption(selectedOption);
  };

  useEffect(() => {
    if (option && !selectedOptions.includes(option.option)) {
      setSelectedOptions([...selectedOptions, option!.option]);
      setSelected(option);
    }
  }, [option, selected, setOptions]);

  return (
    <Modal
      returnTo="/feed"
      setShowProfileManage={() => {}}
      childrenStyle="flex flex-col w-full items-center "
      reloadReturnPage="/feed"
    >
      <button
        className="w-full h-fit bg-midGrey p-5 rounded-md grid grid-cols-[0.1fr_1fr] cursor-default"
        onClick={() => {
          setShowOptions(false);
        }}
      >
        <div className="w-[45px] h-[45px] rounded-full bg-bgprimary m-2 row-span-2 "></div>
        <div className="flex items-center pt-2 text-lightGrey">
          <div className="flex flex-col">
            <h2 className="text-base h-fit">
              Olivia Hayes · Software Engineer
            </h2>
          </div>
        </div>
        <div className="w-full pt-6">
          <Form action="/manage/post" method="post">
            <fieldset className="grid w-full gap-6 md:grid-cols-2 pb-4">
              <SelectType />
            </fieldset>
            <fieldset className="flex flex-col gap-4 pb-3">
              <FormFieldFloating htmlFor="title" placeholder="Title" />

              <FormTextArea
                htmlFor="content"
                placeholder="Share a problem/solution"
              />
            </fieldset>
            <fieldset>
              <FormField
                type="hidden"
                htmlFor="status"
                value="UNRESOLVED"
                placeholder=""
              />
              <Form action="/feed" method="post">
                <FormField
                  type="hidden"
                  htmlFor="returnPage"
                  value="/feed"
                  placeholder=""
                />
              </Form>
            </fieldset>
            <fieldset>
              <FormOptions
                setShowOptions={setShowOptions}
                showOptions={showOptions}
                selected={selected}
                setSelected={setSelected}
                dropDownOptions={
                  <DropdownOptions
                    options={options}
                    setSelected={setSelected}
                    setShowOptions={setShowOptions}
                    setOptionAction={setSelectedOptions}
                    optionAction={selectedTags}
                    selected={selected}
                  />
                }
              />
            </fieldset>
            <ul className="flex text-sm gap-2 w-full flex-wrap">
              {selectedOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    deleteTag(option);
                  }}
                  className="bg-lightGrey rounded-md p-1 px-2 cursor-pointer hover:bg-darkRed "
                >
                  {" "}
                  {option}{" "}
                </button>
              ))}
            </ul>
            <fieldset>
              <FormField
                type="hidden"
                htmlFor="tags"
                placeholder=""
                value={selectedOptions}
              />
            </fieldset>

            <div className="flex flex-row-reverse">
              <SubmitButton value="createPost" />
              <CancelButton />
            </div>
          </Form>
        </div>
      </button>
    </Modal>
  );
}

function SubmitButton({ value }: { value: string }) {
  const navigation = useNavigation();

  const isSubmitting = navigation.formAction === "/feed";

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="bg-txtprimary text-green11 hover:bg-green5 focus:shadow-bgprimary inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
      name="_action"
      value={value}
    >
      {isSubmitting ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-mauve12 "
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
          <p> Creating...</p>
        </>
      ) : (
        "Save"
      )}
    </button>
  );
}

function CancelButton() {
  const navigate = useNavigate();
  const cancelPost = () => {
    navigate("/feed");
  };
  return (
    <button
      type="submit"
      className=" text-lightGrey hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
      onClick={cancelPost}
    >
      Cancel
    </button>
  );
}

function SelectType() {
  return (
    <>
      <li className="list-none">
        <input
          type="radio"
          id="suggestion"
          name="type"
          value="suggestion"
          className="hidden peer"
          required
        />
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label
          htmlFor="suggestion"
          className="inline-flex items-center justify-between w-full p-2 text-lightGrey border hover:bg-altMidGrey rounded-lg cursor-pointer peer-checked:border-txtprimary dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="block">
            <div className="w-full text-sm">Suggestion</div>
          </div>
        </label>
      </li>
      <li className="list-none">
        <input
          type="radio"
          id="problem"
          name="type"
          value="problem"
          className="hidden peer list-none"
          required
        />
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label
          htmlFor="problem"
          className="inline-flex items-center justify-between w-full p-2 text-lightGrey border hover:bg-altMidGrey rounded-lg cursor-pointer peer-checked:border-txtprimary dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="block">
            <div className="w-full text-sm">Problem</div>
          </div>
        </label>
      </li>
    </>
  );
}

export function DropdownOptions({
  options,

  optionAction,
}: {
  options: { id: number; option: string }[];
  setSelected: Dispatch<SetStateAction<{ id: number; option: string }>>;
  setShowOptions: Dispatch<SetStateAction<boolean>>;
  setOptionAction?: Dispatch<SetStateAction<string[]>>;
  optionAction: (
    selectedOption: SetStateAction<{ id: number; option: string } | undefined>,
  ) => void;
  selected: { option: string; id: number };
}) {
  return (
    <>
      <ul
        className="absolute bg-bgprimary z-10 mt-1 max-h-32 w-fit overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        tabIndex={-1}
        role="listbox"
        aria-labelledby="listbox-label"
        aria-activedescendant="listbox-option-3"
      >
        {options.map((option) => (
          <li
            key={option.id}
            className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-txtprimary"
            id="listbox-option-0"
            role="option"
            aria-selected
            onClick={() => {
              optionAction(option);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Space") {
                optionAction(option);
                event.preventDefault(); // Prevent default behavior (like scrolling)
              }
            }}
          >
            <div className="flex items-center">
              <span className="ml-3 block truncate font-normal text-lightGrey">
                {option.option}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
