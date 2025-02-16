import { Modal } from "./Modal2";

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  variant?: "danger" | "warning" | "info";
}

export const Alert: React.FC<AlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText,
  onConfirm,
  variant = "info",
}) => {
  const variantStyles = {
    danger: {
      title: "text-dangerPrimary",
      button: "bg-dangerPrimary hover:bg-dangerPrimary/90",
    },
    warning: {
      title: "text-warningPrimary",
      button: "bg-warningPrimary hover:bg-warningPrimary/90",
    },
    info: {
      title: "text-baseSecondary",
      button: "bg-baseSecondary hover:bg-baseSecondary/90",
    },
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-basePrimary p-6 rounded-lg w-[480px]">
        <h3 className={`text-xl mb-4 ${variantStyles[variant].title}`}>
          {title}
        </h3>
        <p className="text-altMidGrey mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-basePrimaryLight text-baseSecondary rounded-md hover:bg-basePrimaryLight/90"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-basePrimary rounded-md transition-colors ${variantStyles[variant].button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
