import React, { useState, useRef, useEffect } from "react";

import { MultiSearchDocuments } from "~/types/tasks";

import { useNavigate } from "@remix-run/react";
import {
  Check,
  UserCircle,
  Buildings,
  ClipboardText,
  MagnifyingGlass,
} from "phosphor-react";

interface DropdownProps {
  options: string[];
  onSelect: (option: string, selected: boolean) => void;
  placeholder?: string;
  multipleSelect: boolean;
  horizontal?: boolean;
  isActive?: boolean;
  onDropdownToggle?: () => void;
  defaultSelected?: string[]; // Add this to handle parent-controlled selections
  showSearch?: boolean; // New prop to control search visibility
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  onSelect,
  placeholder = "Select an option",
  multipleSelect,
  horizontal = false,
  isActive = false,
  onDropdownToggle,
  defaultSelected = [],
  showSearch = true, // Default to true to maintain backward compatibility
}) => {
  // Initialize selectedOptions with defaultSelected
  const [internalSelectedOptions, setInternalSelectedOptions] =
    useState<string[]>(defaultSelected);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  }>({});

  // Update internal state when defaultSelected changes
  useEffect(() => {
    setInternalSelectedOptions(defaultSelected);
  }, [defaultSelected]);

  useEffect(() => {
    // Focus the search input when dropdown opens
    if (isActive && searchInputRef.current && showSearch) {
      searchInputRef.current.focus();
    }
    // Clear search when dropdown closes
    if (!isActive) {
      setSearchQuery("");
    }
  }, [isActive, showSearch]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calculate dropdown position when it becomes active
  useEffect(() => {
    if (isActive && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 224; // w-56 = 14rem = 224px
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Check if there's enough space to the right
      const spaceToRight = windowWidth - buttonRect.right;
      const spaceToLeft = buttonRect.left;

      let newPosition = {};

      if (horizontal) {
        // For horizontal dropdowns
        if (spaceToRight >= dropdownWidth) {
          // Default position - to the right
          newPosition = { left: "110%", top: "0" };
        } else if (spaceToLeft >= dropdownWidth) {
          // Not enough space to right, but enough to left
          newPosition = { right: "110%", top: "0" };
        } else {
          // Not enough space on either side, position below
          newPosition = { left: "0", top: "100%" };
        }
      } else {
        // For vertical dropdowns
        // Check if dropdown would go off right edge
        if (buttonRect.left + dropdownWidth > windowWidth) {
          newPosition = { right: "0" };
        } else {
          // Default left alignment
          newPosition = { left: "0" };
        }

        // Always position below the button
        newPosition = { ...newPosition, top: "100%" };

        // Check if dropdown would go off bottom of screen
        const dropdownHeight = dropdownRef.current.offsetHeight;
        if (buttonRect.bottom + dropdownHeight > windowHeight) {
          // If there's more space above than below, position above
          if (buttonRect.top > windowHeight - buttonRect.bottom) {
            newPosition = { ...newPosition, bottom: "100%", top: "auto" };
          }
        }
      }

      setDropdownPosition(newPosition);
    }
  }, [isActive, horizontal]);

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

  // Filter options based on search query
  const filteredOptions = showSearch
    ? options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : options;

  return (
    <div ref={dropdownRef} className="relative inline-block start-0 pt-2">
      <button
        ref={buttonRef}
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
          style={dropdownPosition}
          className={`absolute z-50 bg-basePrimary mt-2 w-56 rounded-md shadow-lg ring-1 ring-baseSecondary ring-opacity-5 ${
            horizontal ? "origin-top-left" : "origin-top-right"
          }`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          {/* Search input - Only show if showSearch is true */}
          {showSearch && (
            <div className="px-3 py-2 border-b border-baseSecondary/20">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlass className="h-4 w-4 text-baseSecondary/70" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-baseSecondary/30 rounded-md text-sm bg-basePrimaryLight text-baseSecondary placeholder-baseSecondary/50 focus:outline-none focus:ring-1 focus:ring-baseSecondary"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="py-1 max-h-60 overflow-y-auto" role="none">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = internalSelectedOptions.includes(option);
                return (
                  <button
                    key={index}
                    onClick={() => handleSelect(option)}
                    className={`flex flex-row items-center font-primary ${
                      isSelected
                        ? "bg-accentPrimary text-basePrimary"
                        : "text-baseSecondary"
                    } hover:bg-accentPrimary w-full text-left px-4 py-2 text-sm hover:text-basePrimary`}
                    role="menuitem"
                    type="button"
                  >
                    {isSelected && (
                      <Check className="w-5 h-5 mr-2 flex-shrink-0 text-baseSecondary" />
                    )}
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-baseSecondary/70 italic">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SearchDropdown = ({
  searchResults,
}: {
  searchResults: MultiSearchDocuments[];
}) => {
  const navigate = useNavigate();

  const renderSearchResult = (searchResults: MultiSearchDocuments) => {
    switch (searchResults.collection) {
      case "skillanthropy_charities":
        return (
          <button className="flex text-left items-center m-auto rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2">
            <span>
              <Buildings className="w-5 h-5" />
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
            className="flex text-left items-center m-auto rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2"
            onClick={() =>
              navigate(`/search/?query=${searchResults.data.title}`)
            }
          >
            <span>
              <ClipboardText size={24} weight="regular" />
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
            className="flex text-left items-center m-auto rounded-md space-x-2 hover:bg-basePrimaryLight w-full p-2"
            onClick={() => navigate(`/profile/${searchResults.data.id}`)}
          >
            <span>
              <UserCircle className="w-5 h-5" />
            </span>
            <div>
              <p> {searchResults.data.name} </p>
              <p className="text-xs"> {searchResults.data.bio} </p>
            </div>
          </button>
        );
      default:
        return <div>No search results found</div>;
    }
  };

  return (
    <>
      {searchResults !== undefined && searchResults.length > 0 ? (
        <div>
          {searchResults.map((result, index) => (
            <div key={index}>
              {renderSearchResult(result as unknown as MultiSearchDocuments)}
            </div>
          ))}
        </div>
      ) : (
        <div> No results</div>
      )}
    </>
  );
};
