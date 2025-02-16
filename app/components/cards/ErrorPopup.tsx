import { useEffect, useState } from "react";

export default function ErrorPopup({ error }: { error: string | null }) {
  const [showError, setShowError] = useState(!!error);

  useEffect(() => {
    if (error) {
      setShowError(true);

      // Hide the popup after 5 seconds
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);

      // Clear the timeout if the component unmounts or error changes
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    showError && (
      <div
        className="bg-basePrimaryDark border border-dangerPrimary text-dangerPrimary px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )
  );
}
