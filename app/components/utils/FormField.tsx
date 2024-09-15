import { useEffect, useState } from "react";

interface FormFieldProps {
  htmlFor: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onChange = () => {},
  label,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    onChange(e);
  };

  return (
    <div className="relative z-0">
      <input
        type={type}
        name={htmlFor}
        id={htmlFor}
        aria-label={htmlFor}
        className="block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm bg-basePrimaryLight rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300"
        placeholder={isFocused || hasValue ? "" : placeholder}
        autoComplete={autocomplete}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required
      />
      <label
        htmlFor={htmlFor}
        className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-basePrimaryLight px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
          ${isFocused || hasValue ? "opacity-100" : "opacity-0"}`}
      >
        {label}
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

export const StyledTextarea = ({ htmlFor, placeholder, autocomplete, value, onChange, maxLength, label }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(value.length);
    setHasValue(value.length > 0);
  }, [value]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e) => {
    const newValue = e.target.value.slice(0, maxLength);
    onChange({ target: { value: newValue } });
  };

  return (
    <div className="relative z-0">
      <textarea
        name={htmlFor}
        id={htmlFor}
        aria-label={htmlFor}
        className="block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full h-32 text-sm bg-basePrimaryLight rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300 resize-none"
        placeholder={isFocused || hasValue ? '' : placeholder}
        autoComplete={autocomplete}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required
      />
      <label
        htmlFor={htmlFor}
        className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-basePrimaryLight px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
          ${(isFocused || hasValue) ? 'opacity-100' : 'opacity-0'}`}
      >
        {label}
      </label>
      <div className={`absolute bottom-1 left-2 text-xs ${charCount > maxLength ? 'text-red-500' : 'text-baseSecondary'}`}>
        {charCount}/{maxLength}
      </div>
    </div>
  );
};

interface RadioOptionProps {
  value: string;
  label: string;
  onChange: (role: string) => void;
  isSelected?: boolean;
  description?: string;
}
export const RadioOption = ({
  value,
  label,
  isSelected,
  onChange,
  description,
}: RadioOptionProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow the user to select via "Enter" or "Space" keys
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(value);
    }
  };
  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0} // Make the component focusable
      onKeyDown={handleKeyDown} // Keyboard support
      className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
        isSelected
          ? "border-baseSecondary shadow-md"
          : " hover:border-baseSecondary border-basePrimaryDark "
      }`}
      onClick={() => onChange(value)}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
          isSelected
            ? "border-basePrimaryDark bg-basePrimaryDark"
            : "border-basePrimaryDark"
        }`}
      >
        {isSelected && (
          <div className="w-4 h-4 rounded-full bg-baseSecondary"></div>
        )}
      </div>
      <div>
        <span
          className={`text-lg ${isSelected ? " font-semibold" : "text-basePrimaryDark"}`}
        >
          {label}
        </span>
        <p
          className={`text-xs ${isSelected ? " font-semibold" : "text-basePrimaryDark"}`}
        >
          {description}
        </p>
      </div>
    </div>
  );
};
