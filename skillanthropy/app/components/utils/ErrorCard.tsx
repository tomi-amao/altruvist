import { useNavigate } from "@remix-run/react";
import { PrimaryButton } from "./BasicButton";

export function ErrorCard({
  title,
  message,
  subMessage,
}: {
  title: string;
  message: string;
  subMessage: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-basePrimary bg-[radial-gradient(#CCCCCC_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md p-8 space-y-6 bg-txtsecondary rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-5xl font-header text-baseSecondary text-center">
          {title}
        </h1>
        <div className="space-y-4">
          <p className="font-primary text-baseSecondary text-center">
            {message}
          </p>
          <p className="text-sm text-altMidGrey text-center">{subMessage}</p>
        </div>
        <div className="flex justify-center pt-4">
          <PrimaryButton
            action={() => navigate(-1)}
            text="← Back"
            ariaLabel="return back to previous page"
          />
        </div>
      </div>
    </div>
  );
}
