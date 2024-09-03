import React, { useState, useRef, useEffect } from "react";
import { CheckIcon } from "./icons";

interface DropdownProps {
  options: string[];
  onSelect: (option: string) => void;
  placeholder?: string;
  multipleSelect: boolean;
}

interface DropdownOptions {
  option: string;
  index: number;
  selected: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  onSelect,
  placeholder = "Select an option",
  multipleSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dropDownOptions, setDropDownOptions] = useState<
    DropdownOptions[] | null
  >(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // create a new array with selected property to know when option is selected
  useEffect(() => {
    const optionsWithSelect = options.map((option, index) => {
      return { option, index, selected: false };
    });
    setDropDownOptions(optionsWithSelect);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // returns true if the dropdown element contains the clicked element and false if the click was outside of the dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    // attaches the handleClickOutside function as a listener for the mousedown event on the entire document
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    console.log(dropDownOptions);
  }, [dropDownOptions]);
  const handleSelect = (option: string) => {
    setSelectedOption(option);
    onSelect(option);
    setIsOpen(false);
    // update dropdown options array based on clicked option by toggling the selected value
    if (multipleSelect) {
      setDropDownOptions((prevOptions) => {
        if (!prevOptions) return null;
        return prevOptions?.map((optionObj) =>
          optionObj.option === option
            ? { ...optionObj, selected: !optionObj.selected }
            : optionObj,
        );
      });
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left pt-2">
      <div>
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex  justify-center w-full rounded-md border border-baseSecondary text-baseSecondary px-4 py-2  text-sm font-primary hover:bg-baseSecondary hover:text-basePrimary focus:ring-2 focus:ring-offset-1 pt-2"
          id="options-menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          {placeholder}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute  mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-baseSecondary ring-opacity-5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1 " role="none">
            {dropDownOptions?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(option.option)}
                className={`flex flex-row items-center font-primary ${option.selected ? "bg-baseSecondary text-basePrimary" : ""} text-baseSecondary hover:bg-baseSecondary w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-basePrimary`}
                role="menuitem"
              >
                {option.selected ? <CheckIcon /> : null}
                {option.option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
