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
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Setup portal when component mounts
  useEffect(() => {
    setMounted(true);
    setPortalNode(portalContainer || document.body);

    return () => {
      setMounted(false);
      setPortalNode(null);
    };
  }, [portalContainer]);

  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  // Manage body scroll and event listeners
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

  // Important: Only render when both mounted AND portalNode is available
  if (!mounted || !isOpen || !portalNode) return null;

  // Use a more stable approach to portal creation with explicit portal target
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-basePrimaryDark bg-opacity-30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-basePrimaryLight rounded-lg w-fit z-10 max-h-[80vh] overflow-y-auto">
        <div className="relative">
          {children}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-baseSecondary text-white text-xl font-bold hover:bg-dangerPrimary transition-colors"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
      </div>
    </div>,
    portalNode,
  );
};
