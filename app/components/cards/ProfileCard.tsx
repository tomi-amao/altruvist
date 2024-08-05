import * as Avatar from "@radix-ui/react-avatar";
import * as Tooltip from "@radix-ui/react-tooltip";
import { HoverCard } from "../utils/HoverCard";


export function ProfileCardWithHover() {
    return (

        <HoverCard trigger={<ProfileCard/>} content={<ProfileImg/>}/>
    )
}

export function ProfileCard() {
  return (
    <>
      <div className="flex bg-bgprimary rounded-md gap-3 border-solid border-altMidGrey border-b-2 mb-2 py-2 p-1">
        <div>
          <ProfileImg />
        </div>
        <div className="flex flex-col pr-4 w-full">
          <p className="text-md text-jade9">Olivia Yuri</p>
          <p className="text-xs text-jade11"> Data Scientist</p>
        </div>
      </div>
    </>
  );
}

export function ProfileImg() {
  return (
    <Avatar.Root className="bg-blackA1 inline-flex h-[45px] w-[45px] select-none items-center justify-center overflow-hidden rounded-full align-middle">
      <Avatar.Image
        className="h-full w-full rounded-[inherit] object-cover"
        src="https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?&w=128&h=128&dpr=2&q=80"
        alt="Colm Tuite"
      />

      <Avatar.Fallback
        className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
        delayMs={600}
      >
        CT
      </Avatar.Fallback>
    </Avatar.Root>
  );
}

export function ProfileCardTooltip() {
  return (
    <Tooltip.Provider delayDuration={800} skipDelayDuration={500}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {/* <ProfileCard /> */}
        </Tooltip.Trigger>
        <Tooltip.Content
          side="top"
          className="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-mauve1 px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
          sideOffset={5}
        >
          Tooltip content
          <Tooltip.Arrow className="fill-mauve1" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
