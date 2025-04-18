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

  const handleToggle = () => setIsOpen(!isOpen);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div 
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
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
    <div 
      className={`absolute z-50 mt-10 md:mt-2 sm:right-0 rounded-md shadow-lg border border-baseSecondary 
      sm:max-w-md md:max-w-lg lg:max-w-xl
      max-sm:fixed max-sm:top-4 max-sm:right-2 max-sm:left-2 ${className}`}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
