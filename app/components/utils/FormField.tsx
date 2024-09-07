import { useEffect, useState } from "react";

interface FormFieldProps {
  htmlFor: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: () => Record<string, never>;
  autocomplete?: string;
  error?: string;
  placeholder: string;
}

export function FormField({
  htmlFor,
  label,
  type = "text",
  value,
  autocomplete,
  onChange,
  error = "",
  placeholder,
}: FormFieldProps) {
  const [errorText, setErrorText] = useState(error);

  useEffect(() => {
    setErrorText(error);
  }, [error]);

  return (
    <>
      <div className="flex flex-col w-full">
        <label htmlFor={htmlFor} className="text-base text-mauve1">
          {label}
        </label>
        <input
          // clear error message when the user start to type
          onChange={(e) => {
            onChange(e);
            setErrorText("");
          }}
          type={type}
          id={htmlFor}
          name={htmlFor}
          className="bg-bgsecondary rounded-sm mb-3 p-1 h-6 border-x-txtprimary border"
          value={value}
          aria-label={htmlFor}
          autoComplete={autocomplete}
          placeholder={placeholder}
        />
        <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
          {errorText || ""}
        </div>
      </div>
    </>
  );
}

export function FormFieldFloating({
  htmlFor,
  type = "text",
  value,
  autocomplete,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="relative z-0">
      <input
        type={type}
        name={htmlFor}
        id={htmlFor}
        aria-label={htmlFor}
        className="block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full text-sm bg-basePrimaryDark rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer valid:border-txtprimary valid:border-2  "
        placeholder=""
        autoComplete={autocomplete}
        value={value}
        required
      />
      <label
        htmlFor={htmlFor}
        className="absolute text-md block  text-baseSecondary duration-300 transform -translate-y-2 scale-75 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:block peer-focus:text-baseSecondary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-2  start-1"
      >
        {placeholder}
      </label>
    </div>
  );
}

export function FormTextArea({
  htmlFor,
  value,
  autocomplete,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="relative">
      <textarea
        name={htmlFor}
        id={htmlFor}
        aria-label={htmlFor}
        className="block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full text-sm bg-basePrimaryDark rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer valid:border-txtprimary valid:border-2 p-2 min-h-28"
        placeholder=""
        autoComplete={autocomplete}
        value={value}
        required
      />
      <label
        htmlFor={htmlFor}
        className="absolute text-md block  text-baseSecondary duration-300 transform -translate-y-2 scale-75 top-2 z-10 origin-[0] bg-transparent px-2 peer-focus:px-2 peer-focus:block peer-focus:text-baseSecondary peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-2  start-1"
      >
        {placeholder}
      </label>
    </div>
  );
}
