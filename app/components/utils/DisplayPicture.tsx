import * as Avatar from "@radix-ui/react-avatar";

interface props {
    imgURL: string,
    imgFallback: string,
    imgSize: string
}
export function DisplayPicture({imgURL,imgFallback, imgSize = '45'}: props) {
    const imageContainer = `bg-blackA1 inline-flex h-[${imgSize}px] w-[${imgSize}px] select-none items-center justify-center overflow-hidden rounded-full align-middle`
    const imageSize = `h-[${imgSize}px] w-[${imgSize}px] rounded-[inherit] object-cover`
    return (
      <Avatar.Root className={imageContainer}>
        <Avatar.Image
          className={imageSize}
          src={imgURL}
          alt="profile-picture"
        />
  
        <Avatar.Fallback
          className="text-violet11 leading-1 flex h-full w-full items-center justify-center bg-white text-[15px] font-medium"
          delayMs={600}
        >
          {imgFallback}
        </Avatar.Fallback>
      </Avatar.Root>
    );
  }