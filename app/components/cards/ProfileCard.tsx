import { useState } from "react";
import { users } from "@prisma/client";
import { Link } from "@remix-run/react";

interface ProfileCardProps extends Partial<users> {
  className?: string;
  showHover?: boolean;
}

// Helper function to generate initials from name
const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Custom Avatar Component
const Avatar = ({
  src,
  name,
  size = 45,
}: {
  src?: string;
  name?: string;
  size?: number;
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);

  return (
    <div
      className="relative flex-shrink-0 inline-flex items-center justify-center rounded-full overflow-hidden bg-baseSecondary"
      style={{ width: size, height: size }}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name || "Profile"}
          className="h-full w-full object-cover aspect-square"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-basePrimary text-sm font-medium">{initials}</span>
      )}
    </div>
  );
};

// Profile Card Component
export function ProfileCard({
  name,
  userTitle,
  profilePicture,
  className = "",
  id
}: ProfileCardProps) {
  return (
    <Link to={`/profile/${id}`}>
      <div className={`relative ${className}`}>
        <div className="flex items-center  rounded-md gap-3 border-solid border-altMidGrey shadow-md mb-2 py-2 px-3 transition-all duration-200 hover:bg-basePrimaryLight">
          <Avatar src={profilePicture} name={name} />
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p className="text-md text-baseSecondary font-medium ">{name}</p>
            <p className="text-xs text-altMidGrey text-baseSecondary/80">
              {userTitle}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Export a simpler version without hover functionality
export function SimpleProfileCard(props: ProfileCardProps) {
  return <ProfileCard {...props} showHover={false} />;
}

// Export Avatar component for standalone use
export { Avatar };
