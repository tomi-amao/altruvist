import React, { useEffect, useRef, useState } from "react";

interface DropdownListProps {
  dropdownList: JSX.Element[];
  dropdownToggle: (handleToggle: () => void) => JSX.Element;
}

export const DropdownCard = ({
  dropdownList,
  dropdownToggle,
}: DropdownListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {dropdownToggle(handleToggle)}
      {isOpen && (
        <div className="origin-top-right absolute mt-2 z-50 bg-basePrimary w-44 flex flex-col px-2 py-2 rounded-md shadow-lg ring-1 ring-baseSecondary ring-opacity-5">
          {dropdownList.map((filter, index) =>
            React.cloneElement(filter, {
              isActive: activeDropdown === index,
              onDropdownToggle: () => {
                setActiveDropdown(activeDropdown === index ? null : index);
              },
            }),
          )}
        </div>
      )}
    </div>
  );
};
