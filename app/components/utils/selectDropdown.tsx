import React, { useState, useRef, useEffect } from "react";
import {
  AccountCircleIcon,
  CheckIcon,
  CompanyIcon,
  DescriptionIcon,
} from "./icons";
import {
  CombinedCollections,
  MultiSearchDocuments,
} from "~/types/tasks";

import { useNavigate } from "@remix-run/react";

interface DropdownProps {
  options: string[];
  onSelect: (option: string, selected: boolean) => void;
  placeholder?: string;
  multipleSelect: boolean;
  horizontal?: boolean;
  isActive?: boolean;
  onDropdownToggle?: () => void;
  defaultSelected?: string[]; // Add this to handle parent-controlled selections
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  onSelect,
  placeholder = "Select an option",
  multipleSelect,
  horizontal = false,
  isActive = false,
  onDropdownToggle,
  defaultSelected = [],
}) => {
  // Initialize selectedOptions with defaultSelected
  const [internalSelectedOptions, setInternalSelectedOptions] =
    useState<string[]>(defaultSelected);

  // Update internal state when defaultSelected changes

  useEffect(() => {
    setInternalSelectedOptions(defaultSelected);
  }, [defaultSelected]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    const isSelected = internalSelectedOptions.includes(option);

    // create new selection state
    const newSelectedOptions = isSelected
      ? internalSelectedOptions.filter((item) => item !== option)
      : [...internalSelectedOptions, option];

    // Update internal state
    setInternalSelectedOptions(newSelectedOptions);

    // Notify parent
    onSelect(option, !isSelected);

    if (!multipleSelect) {
      onDropdownToggle?.();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onDropdownToggle?.();
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive, onDropdownToggle]);

  // Get display text for the button
  const getDisplayText = () => {
    if (!multipleSelect) {
      return internalSelectedOptions[0] != "" &&
        internalSelectedOptions.length > 0
        ? internalSelectedOptions
        : placeholder;
    }
    if (internalSelectedOptions.length === 0) {
      return placeholder;
    }
    return ` ${internalSelectedOptions.length} selected`;
  };

  return (
    <div ref={dropdownRef} className="relative inline-block start-0 pt-2">
      <button
        type="button"
        onClick={onDropdownToggle}
        className="inline-flex w-full rounded-md border border-baseSecondary text-baseSecondary px-4 py-2 text-sm font-primary hover:bg-baseSecondary hover:text-basePrimary focus:ring-2 focus:ring-offset-1 pt-2"
        aria-haspopup="true"
        aria-expanded={isActive}
      >
        {getDisplayText()}
        <svg
          className="-mr-1  h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d={
              horizontal
                ? "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                : `M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z`
            }
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isActive && (
        <div
          className={`origin-top-right absolute z-50 bg-basePrimary mt-2 w-56 rounded-md shadow-lg ring-1 ring-baseSecondary ring-opacity-5 ${horizontal && "top-0 left-[110%]"}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1" role="none">
            {options.map((option, index) => {
              const isSelected = internalSelectedOptions.includes(option);
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={`flex flex-row items-center font-primary ${
                    isSelected
                      ? "bg-baseSecondary text-basePrimary"
                      : "text-baseSecondary"
                  } hover:bg-baseSecondary w-full text-left px-4 py-2 text-sm hover:text-basePrimary`}
                  role="menuitem"
                  type="button"
                >
                  {isSelected && <CheckIcon />}
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;

export const SearchDropdown = ({
  searchResults,
}: {
  searchResults: MultiSearchDocuments[];
}) => {
  const [showSelectedSearchItem, setShowSelectedSearchItem] = useState(false);
  const [selectedSearchItem, setSelectedSearchItem] =
    useState<CombinedCollections>();

  const handleSelectedSearchItem = (selectedItemData: CombinedCollections) => {
    setShowSelectedSearchItem((preValue) => !preValue);
    setSelectedSearchItem(selectedItemData);
  };

  const navigate = useNavigate();
  const handleCloseModal = () => {
    setShowSelectedSearchItem(false);
  };

  const renderSearchResult = (searchResults: MultiSearchDocuments) => {
    switch (searchResults.collection) {
      case "skillanthropy_charities":
        return (
          <button
            className="flex text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2 "
            onClick={() => handleSelectedSearchItem(searchResults.data)}
          >
            <span>
              <CompanyIcon />
            </span>
            <div>
              <p> {searchResults.data.name} </p>
              <p className="text-xs">{searchResults.data.description}</p>
            </div>
          </button>
        );
      case "skillanthropy_tasks":
        return (
          <button
            className="flex  text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2  "
            // onClick={() => handleSelectedSearchItem(searchResults.data)}
            onClick={() =>
              navigate(`/search/?query=${searchResults.data.title}`)
            }
          >
            <span>
              <DescriptionIcon />
            </span>
            <div>
              <p> {searchResults.data.title} </p>
              <p className="text-xs"> {searchResults.data.description}</p>
            </div>
          </button>
        );
      case "skillanthropy_users":
        return (
          <button
            className="flex text-left items-center m-auto  rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2 "
            onClick={() => navigate(`/profile/${searchResults.data.id}`)}
          >
            <span>
              <AccountCircleIcon />
            </span>
            <div>
              <p> {searchResults.data.name} </p>
              <p className="text-xs"> {searchResults.data.bio} </p>
            </div>
          </button>
        );
      default:
        <div>No search results found</div>;
    }
  };
  return (
    <>
      {searchResults !== undefined && searchResults.length > 0 ? (
        <div>
          {searchResults.map((result) =>
            renderSearchResult(result as unknown as MultiSearchDocuments),
          )}
        </div>
      ) : (
        <div> No results</div>
      )}
    </>
  );
};
