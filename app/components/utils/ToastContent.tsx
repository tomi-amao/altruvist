import React, { ReactElement } from "react";

interface BaseToastProps {
  message: string;
  icon?: ReactElement;
  variant?: "standard" | "single-button" | "split-button";
}

interface StandardToastProps extends BaseToastProps {
  variant?: "standard";
}

interface SingleButtonToastProps extends BaseToastProps {
  variant: "single-button";
  buttonText: string;
  buttonAction: () => void;
  buttonIcon?: ReactElement;
}

interface SplitButtonToastProps extends BaseToastProps {
  variant: "split-button";
  primaryButtonText: string;
  primaryButtonAction: () => void;
  primaryButtonIcon?: ReactElement;
  secondaryButtonText: string;
  secondaryButtonAction: () => void;
  secondaryButtonIcon?: ReactElement;
}

type ToastContentProps =
  | StandardToastProps
  | SingleButtonToastProps
  | SplitButtonToastProps;

export const ToastContent: React.FC<ToastContentProps> = (props) => {
  const { message, icon, variant = "standard" } = props;

  const renderStandard = () => (
    <div className="flex items-center gap-2">
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{message}</span>
    </div>
  );

  const renderSingleButton = () => {
    const { buttonText, buttonAction, buttonIcon } =
      props as SingleButtonToastProps;

    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          {icon && <span className="flex-shrink-0 ml-2">{icon}</span>}
          <span className="flex-1 text-xs">{message}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            buttonAction();
          }}
          className="flex items-center gap-1 px-3 py-1.5 mr-2 bg-baseSecondary text-basePrimary rounded-md hover:bg-baseSecondary/80 transition-colors text-xs font-medium whitespace-nowrap"
        >
          {buttonIcon && <span className="w-4 h-4">{buttonIcon}</span>}
          {buttonText}
        </button>
      </div>
    );
  };

  const renderSplitButton = () => {
    const {
      primaryButtonText,
      primaryButtonAction,
      primaryButtonIcon,
      secondaryButtonText,
      secondaryButtonAction,
      secondaryButtonIcon,
    } = props as SplitButtonToastProps;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className="flex-1">{message}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              primaryButtonAction();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-accentPrimary text-baseSecondary rounded-md hover:bg-accentPrimaryDark transition-colors text-sm font-medium flex-1"
          >
            {primaryButtonIcon && (
              <span className="w-4 h-4">{primaryButtonIcon}</span>
            )}
            {primaryButtonText}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              secondaryButtonAction();
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-baseSecondary text-basePrimary rounded-md hover:bg-baseSecondary/80 transition-colors text-sm font-medium flex-1"
          >
            {secondaryButtonIcon && (
              <span className="w-4 h-4">{secondaryButtonIcon}</span>
            )}
            {secondaryButtonText}
          </button>
        </div>
      </div>
    );
  };

  switch (variant) {
    case "single-button":
      return renderSingleButton();
    case "split-button":
      return renderSplitButton();
    default:
      return renderStandard();
  }
};

// Convenience functions for easy usage
export const createStandardToast = (message: string, icon?: ReactElement) => (
  <ToastContent message={message} icon={icon} variant="standard" />
);

export const createSingleButtonToast = (
  message: string,
  buttonText: string,
  buttonAction: () => void,
  options?: {
    icon?: ReactElement;
    buttonIcon?: ReactElement;
  },
) => (
  <ToastContent
    message={message}
    variant="single-button"
    buttonText={buttonText}
    buttonAction={buttonAction}
    icon={options?.icon}
    buttonIcon={options?.buttonIcon}
  />
);

export const createSplitButtonToast = (
  message: string,
  primaryButtonText: string,
  primaryButtonAction: () => void,
  secondaryButtonText: string,
  secondaryButtonAction: () => void,
  options?: {
    icon?: ReactElement;
    primaryButtonIcon?: ReactElement;
    secondaryButtonIcon?: ReactElement;
  },
) => (
  <ToastContent
    message={message}
    variant="split-button"
    primaryButtonText={primaryButtonText}
    primaryButtonAction={primaryButtonAction}
    secondaryButtonText={secondaryButtonText}
    secondaryButtonAction={secondaryButtonAction}
    icon={options?.icon}
    primaryButtonIcon={options?.primaryButtonIcon}
    secondaryButtonIcon={options?.secondaryButtonIcon}
  />
);

export default ToastContent;
