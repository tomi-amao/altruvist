import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react"; // Import X icon from phosphor icons

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
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="relative bg-basePrimaryLight rounded-lg w-fit z-10 max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="">
          {children}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full text-baseSecondary hover:bg-dangerPrimary hover:text-basePrimary transition-colors"
            aria-label="Close modal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} weight="bold" className="z-50" />
          </button>
        </div>
      </div>
    </div>,
    portalNode,
  );
};
