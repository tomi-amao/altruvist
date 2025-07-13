import { ReactElement } from "react";
import { toast as reactToastify, ToastOptions, Id } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: "custom-toast",
  progressClassName: "custom-toast-progress",
};

export const toast = {
  success: (component: ReactElement, options?: ToastOptions): Id => {
    return reactToastify.success(component, {
      ...defaultOptions,
      ...options,
    });
  },

  error: (component: ReactElement, options?: ToastOptions): Id => {
    return reactToastify.error(component, {
      ...defaultOptions,
      ...options,
    });
  },

  info: (component: ReactElement, options?: ToastOptions): Id => {
    return reactToastify.info(component, {
      ...defaultOptions,
      ...options,
    });
  },

  warning: (component: ReactElement, options?: ToastOptions): Id => {
    return reactToastify.warning(component, {
      ...defaultOptions,
      ...options,
    });
  },

  // Generic toast with custom styling
  default: (component: ReactElement, options?: ToastOptions): Id => {
    return reactToastify(component, {
      ...defaultOptions,
      ...options,
    });
  },

  // Utility functions
  dismiss: (toastId?: Id) => reactToastify.dismiss(toastId),
  isActive: (toastId: Id) => reactToastify.isActive(toastId),
};

// Export specific toast types for easier imports
export const showSuccess = toast.success;
export const showError = toast.error;
export const showInfo = toast.info;
export const showWarning = toast.warning;
