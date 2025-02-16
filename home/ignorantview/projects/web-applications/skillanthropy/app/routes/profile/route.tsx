import { useNavigate } from "@remix-run/react";
import { PrimaryButton } from "~/components/utils/BasicButton";

export default function ProfileRoute() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-basePrimary bg-[radial-gradient(#CCCCCC_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md p-8 space-y-6 bg-txtsecondary rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <h1 className="text-5xl font-header text-baseSecondary text-center">
          Profile Page
        </h1>
        <div className="space-y-4">
          <p className="font-primary text-baseSecondary text-center">
            Please specify a user ID to view a profile.
          </p>
          <p className="text-sm text-altMidGrey text-center">
            Example: /profile/123
          </p>
        </div>
        <div className="flex justify-center pt-4 ">
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
