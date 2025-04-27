import { useState } from "react";
import { users } from "@prisma/client";

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
  showHover = false,
}: ProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center  rounded-md gap-3 border-solid border-altMidGrey shadow-md mb-2 py-2 px-3 transition-all duration-200 hover:bg-basePrimaryLight">
        <Avatar src={profilePicture} name={name} />
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-md text-baseSecondary font-medium ">{name}</p>
          <p className="text-xs text-altMidGrey ">{userTitle}</p>
        </div>
      </div>

      {showHover && isHovered && (
        <div className="absolute z-10 top-full left-0 mt-2 w-64 bg-basePrimary rounded-lg  p-4 border border-baseSecondary">
          <div className="flex gap-4 items-center">
            <Avatar src={profilePicture} name={name} size={60} />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-baseSecondary truncate">
                {name}
              </h3>
              <p className="text-sm text-altMidGrey truncate">{userTitle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export a simpler version without hover functionality
export function SimpleProfileCard(props: ProfileCardProps) {
  return <ProfileCard {...props} showHover={false} />;
}

// Export Avatar component for standalone use
export { Avatar };
