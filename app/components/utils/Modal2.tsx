import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  portalContainer?: HTMLElement; // Optional custom portal container
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  portalContainer,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen && mounted) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else if (mounted) {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, handleEsc, mounted]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4  "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-basePrimaryDark bg-opacity-30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative rounded-lg w-fit z-10 max-h-[80vh] overflow-y-auto">
        <div>
          {children}
          <button
            onClick={onClose}
            className="absolute top-4 right-4"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
      </div>
    </div>,
    portalContainer || document.body,
  );
};
