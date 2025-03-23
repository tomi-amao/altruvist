import React, { useState, useRef, useEffect } from "react";

interface PopoverProps {
  children: React.ReactNode;
}

export function Popover({ children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close the popover when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract trigger and content from children
  const triggerAndContent = React.Children.toArray(children);
  const trigger = triggerAndContent[0];
  const content = triggerAndContent[1];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && content}
    </div>
  );
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function PopoverContent({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute z-50 mt-2 right-0  rounded-md shadow-lg border border-baseSecondary ${className}`}>
      {children}
    </div>
  );
}
