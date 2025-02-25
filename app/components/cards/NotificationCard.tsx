import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NotificationProps = {
  message: string;
  type?: "success" | "error" | "info"; // Optional, defaults to 'info'
  duration?: number; // Optional, defaults to 3000 ms
};

const Notification = ({
  message,
  type = "info",
  duration = 3000,
}: NotificationProps) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = 10; // Update progress every 10 ms
    const decrement = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(prev - decrement, 0));
    }, interval);

    const timeout = setTimeout(() => {
      setVisible(false);
      clearInterval(timer);
    }, duration);

    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [duration]);

  if (!visible) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`relative rounded-lg shadow-lg text-sm bg-basePrimary border border-baseSecondary text-baseSecondary overflow-hidden
          ${
            type === "success"
              ? "border-confirmPrimary"
              : type === "error"
                ? "border-dangerPrimary"
                : "border-baseSecondary"
          }
        `}
      >
        <div className="p-3">{message}</div>
        <div
          className={`h-1 transition-all duration-100 ease-linear ${
            type === "success"
              ? "bg-confirmPrimary"
              : type === "error"
                ? "bg-dangerPrimary"
                : "bg-baseSecondary"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>,
    document.body,
  );
};

export default Notification;
