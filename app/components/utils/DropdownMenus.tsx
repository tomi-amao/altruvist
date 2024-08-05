import * as DropdownMenu from "@radix-ui/react-dropdown-menu";


import { DisplayPicture } from "./DisplayPicture";

export interface MenuProps {
  userDetails: {
    profile: {
      firstName: string;
      lastName: string;
      username: string | null;
      profilePicture: string | null;
      role: string | null;
      type: string | null;
    };
    email: string;
  };
  trigger: JSX.Element;
  menuItems: [{ profile: JSX.Element }, { inbox: JSX.Element }];
  menuItems2: [];
}

export const DropdownMenus = ({
  trigger,
  menuItems,
  userDetails,
  menuItems2,
}: MenuProps) => {

  //create a new object extracting the first key-pair in the object, seperating the action and the dropdown menu item
  const dropdownItems = menuItems.map((option) => {
    const [key, value] = Object.entries(option)[0];
    const [actionKey, action] = Object.entries(option)[1];

    return { key, value, action, actionKey }; // Create a new object with key and value
  });
  const dropdownItems2 = menuItems2.map((option) => {
    const [key, value] = Object.entries(option)[0];
    const [actionKey, action] = Object.entries(option)[1];

    return { key, value, action, actionKey }; // Create a new object with key and value
  });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button aria-label="Customise options">{trigger}</button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[250px] bg-bgprimary rounded-md p-[5px] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
          sideOffset={5}
        >
          <div className="w-full flex flex-col items-center text-jade11 text-xl">
            <DisplayPicture
              imgURL={userDetails?.profile?.profilePicture}
              imgSize="45"
              imgFallback=""
            />

            {userDetails && <h1> {userDetails?.profile?.username} </h1>}
          </div>
          {dropdownItems.map((value) => (
            <>
              <DropdownMenu.Item
                key={value.key}
                onClick={() => {
                  value.action();
                }}
                className="group text-[13px] leading-none text-jade10 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-jade10 data-[highlighted]:text-violet1"
              >
                {value.key}
                <div className="ml-auto pl-[20px] text-mauve11 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8">
                  {value.value}
                </div>
              </DropdownMenu.Item>
            </>
          ))}

          <DropdownMenu.Separator className="h-[1px] bg-violet6 m-[5px]" />
          {dropdownItems2.map((value) => (
            <>
              <DropdownMenu.Item
                key={value.key}
                onClick={() => {
                  value.action();
                }}
                className="group text-[13px] leading-none text-jade10 rounded-[3px] flex items-center h-[25px] px-[5px] relative pl-[25px] select-none outline-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:bg-jade10 data-[highlighted]:text-violet1"
              >
                {value.key}
                <div className="ml-auto pl-[20px] text-mauve11 group-data-[highlighted]:text-white group-data-[disabled]:text-mauve8">
                  {value.value}
                </div>
              </DropdownMenu.Item>
            </>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export const DotsVerticalIcon = () => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
        fill="#27B08B"
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );
};

export const ArchiveIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
};

export const HideIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
};

export const BinIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
};
