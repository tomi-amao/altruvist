import { toast as reactToastify, ToastOptions, Id } from "react-toastify";

// Default toast options that match your design system
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

// Custom toast utility with your design system
export const toast = {
  success: (message: string, options?: ToastOptions): Id => {
    return reactToastify.success(message, {
      ...defaultOptions,
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions): Id => {
    return reactToastify.error(message, {
      ...defaultOptions,
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions): Id => {
    return reactToastify.info(message, {
      ...defaultOptions,
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions): Id => {
    return reactToastify.warning(message, {
      ...defaultOptions,
      ...options,
    });
  },

  // Generic toast with custom styling
  default: (message: string, options?: ToastOptions): Id => {
    return reactToastify(message, {
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
