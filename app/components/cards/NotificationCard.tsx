import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type NotificationProps = {
  message: string;
  type?: "success" | "error" | "info"; // Optional, defaults to 'info'
  duration?: number; // Optional, defaults to 3000 ms
};

const Notification: React.FC<NotificationProps> = ({
  message,
  type = "info",
  duration = 3000,
}) => {
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
    <div
      className={`fixed top-4 right-4 p-2 rounded-lg shadow-lg text-sm transition-opacity duration-300 z-50 border bg-basePrimary border-baseSecondary text-baseSecondary border-b-4
        ${type === "success" ? "border-confirmPrimary" : type === "error" ? "border-dangerPrimary" : "bg-basePrimaryLight"}
      `}
    >
      {message}
      <div className=" absolute top-12 h-[2px] w-full rounded-full ">
        {/* <div
          className="h-full bg-baseSecondary rounded"
          style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
        ></div> */}
      </div>
    </div>,
    document.body,
  );
};

export default Notification;
