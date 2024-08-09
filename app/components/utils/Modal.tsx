import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Link, useNavigate, useSubmit } from "@remix-run/react";
import { Dispatch, SetStateAction } from "react";

interface props {
  children: React.ReactNode;
  returnTo: string;
  setShowProfileManage: Dispatch<SetStateAction<boolean>>;
  dialogTitle?: string;
  dialogDescription?: string;
  modalWidth?: string;
  modalHeight?: string;
  childrenStyle: string;
  reloadReturnPage?: string;
}

export function Modal({
  children,
  returnTo,
  setShowProfileManage,
  dialogTitle,
  dialogDescription,
  childrenStyle,
  reloadReturnPage,
}: props) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const modalCloseHandler = (page: string) => {
    setShowProfileManage(false);
    navigate(page, { replace: true });

    if (reloadReturnPage) {
      submit(
        { post: reloadReturnPage ? reloadReturnPage : "" },
        { method: "POST", action: reloadReturnPage, replace: true },
      );
    }
  };

  const contentStyle = ` data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] flex flex-col items-baseline max-h-[85vh] w-[50vw]  translate-x-[-50%] translate-y-[-50%] rounded-[6px] p-[25px] focus:outline-none`;
  return (
    <>
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-blackA6 data-[state=open]:animate-overlayShow fixed inset-0  " />
          <Dialog.Content
            className={contentStyle}
            // does not work with firefox browser
            onInteractOutside={() => {
              modalCloseHandler(returnTo);
            }}
          >
            {dialogDescription && (
              <>
                {" "}
                <Dialog.Title className="text-jade9 m-0 text-[17px] font-medium">
                  {dialogTitle}
                </Dialog.Title>
                <Dialog.Description className="text-mauve11 mt-[10px] mb-5 text-[15px] leading-normal">
                  {dialogDescription}
                </Dialog.Description>{" "}
              </>
            )}
            <div className={childrenStyle}>{children}</div>

            <Dialog.Close
              asChild
              onClick={() => {
                setShowProfileManage(false);
              }}
            >
              <Link
                to={returnTo}
                className="text-lightGrey hover:bg-violet4 focus:shadow-violet7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
                aria-label="Close"
              >
                <Cross2Icon />
              </Link>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
