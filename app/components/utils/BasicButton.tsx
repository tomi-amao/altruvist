export function PrimaryButton({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
}: {
  text: string;
  name?: string;
  value?: string;
  action?: () => Record<string, never>;
  ariaLabel: string;
}) {
  return (
    <>
      <button
        className="flex bg-accentPrimary rounded-md p-2 px-4 font-primary text-baseSecondary"
        aria-label={ariaLabel}
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

export function CancelButton({
  text,
  name,
  value,
  action = undefined,
  ariaLabel,
}: {
  text: string;
  name?: string;
  value?: string;
  action?: () => Record<string, never>;
  ariaLabel: string;
}) {
  return (
    <>
      <button
        className="flex  rounded-md p-2 px-4"
        aria-label={ariaLabel}
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
