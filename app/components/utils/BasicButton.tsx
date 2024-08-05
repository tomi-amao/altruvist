
export function PrimaryButton() {
  return (
    <>
      <button
        className=" inline-flex items-center justify-center rounded px-[15px] text-[13px] leading-none h-6 gap-[5px] bg-white text-jade9  hover:bg-jade9 hover:text-mauve1 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-jade9 outline-none "
        aria-label="View All"
      >
        View All
      </button>
    </>
  );
}
export function SecondaryButton({text, name, value, action = undefined} : {text:string, name?: string, value?:string, action?: () => Record<string, never> }) {
  return (
    <>
      <button
        className="inline-flex items-center justify-center rounded px-[15px] text-[13px]  leading-none h-6 gap-[5px] bg-white text-mauve1 bg-jade9 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-jade9 outline-none "
        aria-label="Suggest an Idea"
        type="submit"
        name={name}
        value={value}
        onClick={action}
      >
        {text}
      </button>
    </>
  );
}
