interface ButtonProps {
  text: string;
  name?: string;
  value?: string;
  action?: () => void;
  ariaLabel: string;
  form?: string;
  type?: "submit" | "reset" | "button" | undefined;
  icon?: JSX.Element;
  isSelected?: boolean;
  isDisabled?: boolean;
}

export function PrimaryButton({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
  form = undefined,
  type = "submit",
  icon = undefined,
  isDisabled = false,
}: ButtonProps) {
  return (
    <>
      <button
        className="flex bg-accentPrimary rounded-md p-2 px-4 font-primary text-baseSecondary disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={ariaLabel}
        type={type}
        name={name}
        value={value}
        onClick={action}
        form={form}
        disabled={isDisabled}
      >
        {icon && <span> {icon}</span>}

        {text}
      </button>
    </>
  );
}

export function SecondaryButton({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
  type,
  icon = undefined,
  isSelected = false,
  isDisabled = false,
}: ButtonProps) {
  return (
    <div className="flex items-center">
      {icon && <span className="mr-2">{icon}</span>}
      <button
        className={` ${isSelected ? "bg-accentPrimary text-baseSecondary items-center" : " bg-baseSecondary text-basePrimary"} flex justify-center items-center rounded-md p-2 px-4 font-primary w-fit hover:bg-accentPrimary hover:text-baseSecondary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-baseSecondary disabled:hover:text-basePrimary`}
        aria-label={ariaLabel}
        type={type}
        name={name}
        value={value}
        onClick={action}
        disabled={isDisabled}
      >
        {text}
      </button>
    </div>
  );
}

export function SecondaryButtonAlt({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
  type,
  icon = undefined,
}: ButtonProps) {
  return (
    <>
      <button
        className="flex rounded-md p-2 px-4 w-fit h-fit font-primary text-baseSecondary  hover:bg-basePrimaryDark hover:text-baseSecondary border border-baseSecondary"
        aria-label={ariaLabel}
        type={type}
        name={name}
        value={value}
        onClick={action}
      >
        {icon && <span> {icon}</span>}

        {text}
      </button>
    </>
  );
}

export function CancelButton({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
  icon,
}: ButtonProps) {
  return (
    <>
      <button
        className="flex  rounded-md p-2 px-2 text-dangerPrimary   items-center space-x-2 text-sm"
        aria-label={ariaLabel}
        type="submit"
        name={name}
        value={value}
        onClick={action}
      >
        {icon && <span> {icon}</span>}

        {text}
      </button>
    </>
  );
}
