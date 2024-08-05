import { Dispatch, SetStateAction } from "react";
import { Modal } from "~/components/utils/Modal";
import { DisplayPicture } from "../utils/DisplayPicture";
import * as Tabs from "@radix-ui/react-tabs";
import { Form } from "@remix-run/react";
import { FormField } from "../utils/FormField";
import { SecondaryButton } from "../utils/BasicButton";


interface props {
  setShowProfileManage: Dispatch<SetStateAction<boolean>>;
  returnTo: string;
  user: {
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
}

export default function ManageProfile({ setShowProfileManage, user, returnTo }: props) {

  return (
    <Modal
      returnTo={returnTo}
      setShowProfileManage={setShowProfileManage}
      modalWidth="[90vw]"
      childrenStyle="w-full"
    >
      <Tabs.Root
        defaultValue="account"
        orientation="vertical"
        className="grid grid-cols-[0.4fr_1fr] col-span-2 w-full"
      >
        <div className="row-span-2 flex-col  flex">
          <div className="flex items-center gap-2 w-fit">
            <DisplayPicture
              imgURL={user.profile.profilePicture!}
              imgSize="45"
              imgFallback=""
            />
            <div className="flex flex-col p-2">
              <h1 className="text-lightGrey"> {user.profile?.username} </h1>
              <h2 className="text-lightGrey"> {user.email} </h2>
            </div>
          </div>
          <Tabs.List className="flex text-lightGrey mt-2 shrink col-start-1">
            <div className="flex flex-col w-fit">
              <Tabs.Trigger value="account">
                <li className="flex gap-3 m-1 hover:bg-lightGrey hover:text-mauve2 rounded-md px-2">
                  <AccountIcon /> Account
                </li>
              </Tabs.Trigger>
              <Tabs.Trigger value="settings">
                <li className="flex gap-3 m-1 hover:bg-lightGrey hover:text-mauve2 rounded-md px-2">
                  <SettingsIcon /> Settings
                </li>
              </Tabs.Trigger>
              <Tabs.Trigger value="notifications">
                <li className="flex gap-3 m-1 hover:bg-lightGrey hover:text-mauve2 rounded-md px-2">
                  <NotificationIcon /> Notifications
                </li>
              </Tabs.Trigger>
              <Tabs.Trigger value="language">
                <li className="flex gap-3 m-1 hover:bg-lightGrey hover:text-mauve2 rounded-md px-2">
                  <RegionIcon /> Language & Region
                </li>
              </Tabs.Trigger>
            </div>
          </Tabs.List>
        </div>
        <div className="flex col-start-2 row-start-1 row-span-2 grow text-lightGrey">
          <Tabs.Content value="account" className="w-full">
            <h1 className="border-b-2 border-midGrey pb-4 pt-2 mx-4">
              My Profile
            </h1>
            <Form
              method="post"
              action="/profile/manage"
              encType="multipart/form-data"
            >
              <div className="pt-4 mx-4 flex flex-row  w-fit">
                <div className="flex-col items-center pt-2">
                  <DisplayPicture
                    imgURL={user.profile.profilePicture!}
                    imgSize="45"
                    imgFallback=""
                  />

                  <input
                    id="avatar"
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="overflow-hidden h-[1px] w-[1px] absolute "
                  />
                  <label
                    htmlFor="avatar"
                    className="flex flex-row gap-1 mt-1 items-center cursor-pointer hover:underline"
                  >
                    Edit <EditIcon />
                  </label>
                </div>

                <div className="px-10">
                  <FormField
                    label="Preferred Name"
                    type="text"
                    htmlFor="username"
                    placeholder={user.profile.username!}
                  />
                  {/* <FormField
                      label="Department"
                      type="text"
                      htmlFor="department"
                      
                    /> */}
                  <FormField
                    label="Job role"
                    type="text"
                    htmlFor="role"
                    placeholder={user.profile.role!}
                  />
                  <div className="flex w-full flex-row-reverse">
                    <SecondaryButton text="Save" />
                  </div>
                </div>
              </div>
            </Form>
            <h1 className="border-b-2 border-midGrey pb-4 pt-2 mx-4">
              Account security
            </h1>
            <div className="pt-4  px-4   w-full">
              <h2 className="flex w-full justify-between ">
                Email <SecondaryButton text="Change email" />
              </h2>
              <h3 className="text-jade11"> {user.email}</h3>
            </div>
            <div className="pt-4  px-4   w-full">
              <h2 className="flex w-full justify-between ">
                Password <SecondaryButton text="Change password" />
              </h2>
              <h3 className="text-jade11"> ********* </h3>
            </div>
            <div className="pt-4  px-4   w-full">
              <h2 className="flex w-full justify-between ">
                Two-step Verification <SecondaryButton text="Enable" />
              </h2>
            </div>
            <form method="post" onSubmit={e => !confirm('Are you sure?') ? e.preventDefault() : true}>

            <div className="pt-8  px-4  w-full"> 
              <h2 className="flex w-full justify-between">
                Danger Zone <SecondaryButton text="Delete account" name="action" value="delete" />
              </h2>
            
            </div>
            </form>

          </Tabs.Content>
          <Tabs.Content value="settings">
            <p>settings</p>
          </Tabs.Content>
          <Tabs.Content value="notifications">
            <p>notifications</p>
          </Tabs.Content>
          <Tabs.Content value="language">
            <p>language</p>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </Modal>
  );
}

export function NotificationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
    </svg>
  );
}
export function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
    </svg>
  );
}
export function AccountIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
    </svg>
  );
}
export function RegionIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
    >
      <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Zm0-82q26-36 45-75t31-83H404q12 44 31 83t45 75Zm-104-16q-18-33-31.5-68.5T322-320H204q29 50 72.5 87t99.5 55Zm208 0q56-18 99.5-55t72.5-87H638q-9 38-22.5 73.5T584-178ZM170-400h136q-3-20-4.5-39.5T300-480q0-21 1.5-40.5T306-560H170q-5 20-7.5 39.5T160-480q0 21 2.5 40.5T170-400Zm216 0h188q3-20 4.5-39.5T580-480q0-21-1.5-40.5T574-560H386q-3 20-4.5 39.5T380-480q0 21 1.5 40.5T386-400Zm268 0h136q5-20 7.5-39.5T800-480q0-21-2.5-40.5T790-560H654q3 20 4.5 39.5T660-480q0 21-1.5 40.5T654-400Zm-16-240h118q-29-50-72.5-87T584-782q18 33 31.5 68.5T638-640Zm-234 0h152q-12-44-31-83t-45-75q-26 36-45 75t-31 83Zm-200 0h118q9-38 22.5-73.5T376-782q-56 18-99.5 55T204-640Z" />
    </svg>
  );
}
export function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20px"
      viewBox="0 -960 960 960"
      width="20px"
      fill="#e8eaed"
    >
      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
    </svg>
  );
}
