import { useSubmit } from "@remix-run/react";
import { DisplayPicture } from "./DisplayPicture";
import { DropdownMenus } from "./DropdownMenus";
import { ExitIcon } from "@radix-ui/react-icons";
import { ProfileIcon, InboxIcon, CreatePostIcon, SettingsIcon } from "./icons";
import { useState } from "react";
import ManageProfile from "../cards/ManageProfileCard";

interface props {
  userId: string;
  userDetails: {
    profile: {
      firstName: string;
      lastName: string;
      username: string | null;
      role: string | null;
      profilePicture: string;
      type: string | null;
    };
    email: string;
  };
}

export default function ProfileDropdown({ userDetails }: props) {
  const submit = useSubmit();
  const [showProfileManage, setShowProfileManage] = useState(false);

  const profileAction = () => {
    setShowProfileManage((preValue) => !preValue);
  };
  const logout = () => {
    submit({ _action: "logout" }, { method: "POST", action: "/logout" });
  };

  const profileDropdownOptions = [
    { Profile: <ProfileIcon />, action: profileAction },
    { Inbox: <InboxIcon />, action: () => {} },
    { "Create Post": <CreatePostIcon />, action: () => {} },
    { Settings: <SettingsIcon />, action: () => {} },
  ];

  const profileDropdownOptions2 = [
    { "Sign Out": <ExitIcon />, action: logout },
  ];

  return (
    <>
      <DropdownMenus
        trigger={
          <DisplayPicture
            imgURL={userDetails?.profile?.profilePicture}
            imgSize="45"
            imgFallback=""
          />
        }
        menuItems={profileDropdownOptions}
        menuItems2={profileDropdownOptions2}
        userDetails={userDetails}
      />
      {showProfileManage && (
        <ManageProfile
          setShowProfileManage={setShowProfileManage}
          user={userDetails ?? null}
          returnTo="/feed"
        ></ManageProfile>
      )}
    </>
  );
}
