import * as Tooltip from "@radix-ui/react-tooltip";
import { ReactElement } from "react";

interface props {
    trigger: ReactElement;
    content: ReactElement;
}

export function HoverCard(props: props) {
    return (
      <Tooltip.Provider delayDuration={800} skipDelayDuration={500}>
        <Tooltip.Root>
          <Tooltip.Trigger>
            {props.trigger}
          </Tooltip.Trigger>
          <Tooltip.Content
            side="top"
            className="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px] bg-mauve1 px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]"
            sideOffset={5}
          >
            {props.content}
            <Tooltip.Arrow className="fill-mauve1" />
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }