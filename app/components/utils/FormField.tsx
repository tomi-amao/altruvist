import { ChangeEvent, useEffect, useRef, useState } from "react";

interface FormFieldProps {
  htmlFor: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autocomplete?: string;
  error?: string;
  placeholder?: string;
  backgroundColour?: string;
  defaultValue?: string;
}
interface FormTextareaProps {
  htmlFor: string;
  label?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autocomplete?: string;
  error?: string;
  placeholder: string;
  backgroundColour?: string;
  maxLength: number | null;
  defaultValue?: string;
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
  backgroundColour = "bg-basePrimaryDark",
  defaultValue,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        className={`block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm ${backgroundColour} rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300 placeholder:text-baseSecondary placeholder:text-opacity-60`}
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
        className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] ${backgroundColour} px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
          ${isFocused || hasValue ? "opacity-100" : "opacity-0"}`}
      >
        {label}
      </label>
    </div>
  );
}

export const FormTextarea = ({
  htmlFor,
  placeholder,
  autocomplete,
  value,
  onChange = () => {},
  maxLength,
  label,
  backgroundColour = "bg-basePrimaryDark",
}: FormTextareaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(value!.length);
    setHasValue(value!.length > 0);
  }, [value]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e) => {
    const newValue = e.target.value.slice(0, maxLength!);
    onChange({ target: { value: newValue } });
  };

  return (
    <div className="relative z-0">
      <textarea
        name={htmlFor}
        id={htmlFor}
        aria-label={htmlFor}
        className={`block text-baseSecondary px-2.5 pb-2.5 pt-4 w-full h-32 text-sm ${backgroundColour} rounded-lg border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300 resize-none placeholder:text-baseSecondary placeholder:text-opacity-60`}
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
        className={`absolute text-md text-baseSecondary duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] ${backgroundColour} px-2 peer-focus:px-2 peer-focus:text-baseSecondary start-1
          ${isFocused || hasValue ? "opacity-100" : "opacity-0"}`}
      >
        {label}
      </label>
      <div
        className={`absolute bottom-1 left-2 text-xs ${charCount > maxLength ? "text-red-500" : "text-baseSecondary"}`}
      >
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

interface ListInputProps {
  inputtedList: string[];
  availableOptions?: string[]; // Optional array for dropdown suggestions
  onInputsChange: (inputtedList: string[]) => void; // Callback to update parent state
  placeholder?: string;
  allowCustomOptions?: boolean; // Optional flag to allow custom inputtedList
  useDefaultListStyling?: boolean;
}

export const ListInput: React.FC<ListInputProps> = ({
  inputtedList,
  availableOptions = [],
  onInputsChange,
  placeholder = "Enter a input",
  allowCustomOptions = true,
  useDefaultListStyling = true,
}) => {
  const [newOption, setNewOption] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewOption(value);
    setError("");

    if (value.trim() === "" || !availableOptions.length) {
      setFilteredOptions([]);
      setIsDropdownVisible(false);
    } else {
      const filtered = availableOptions.filter(
        (input) =>
          input.toLowerCase().includes(value.toLowerCase()) &&
          !inputtedList.includes(input),
      );
      setFilteredOptions(filtered);
      setIsDropdownVisible(true);
    }
  };

  const addInput = (input: string) => {
    const trimmedOption = input.trim();
    if (trimmedOption === "") return;

    if (availableOptions.length && !availableOptions.includes(trimmedOption)) {
      if (!allowCustomOptions) {
        setError(`"${trimmedOption}" is not a valid input`);
        return;
      }
    }

    if (!inputtedList.includes(trimmedOption)) {
      onInputsChange([...inputtedList, trimmedOption]);
      setNewOption("");
      setFilteredOptions([]);
      setIsDropdownVisible(false);
      setError("");
    } else {
      setError(`"${trimmedOption}" is already added`);
    }
  };

  const removeTag = (inputToRemove: string) => {
    onInputsChange(inputtedList.filter((input) => input !== inputToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInput(newOption);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            value={newOption}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsDropdownVisible(true)}
            className="block text-baseSecondary px-2.5 pb-2.5 pt-3 w-full text-sm bg-basePrimaryLight rounded-l-md border-[1px] focus:outline-none focus:border-baseSecondary peer transition-all duration-300 placeholder:text-baseSecondary placeholder:text-opacity-60"
            placeholder={placeholder}
          />

          <button
            type="button"
            onClick={() => addInput(newOption)}
            className="bg-baseSecondary text-basePrimaryLight px-4 rounded-r-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        {error && <span className="text-red-500 text-sm mt-1">{error}</span>}

        {isDropdownVisible && filteredOptions.length > 0 && (
          <ul
            ref={dropdownRef}
            className="absolute left-0 w-full bg-white border rounded-lg border-baseSecondary mt-2 max-h-60 overflow-auto z-20 bg-basePrimaryLight"
          >
            {filteredOptions.map((input, index) => (
              <li
                key={index}
                onClick={() => addInput(input)}
                className="p-2 cursor-pointer hover:bg-blue-100 transition-colors"
              >
                {input}
              </li>
            ))}
          </ul>
        )}
      </div>

      {useDefaultListStyling && (
        <div className="flex flex-wrap gap-2">
          {inputtedList.map((input, index) => (
            <span
              key={index}
              className="bg-baseSecondary text-basePrimaryLight px-3 py-1 rounded-full flex items-center"
            >
              {input}
              <button
                type="button"
                onClick={() => removeTag(input)}
                className="ml-2 text-xs bg-red-500 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const FilePreviewButton: React.FC<{
  fileUrl: string | undefined;
  fileName: string | undefined;
  fileSize: number | null;
  fileExtension: string | undefined;
}> = ({ fileUrl, fileName, fileSize, fileExtension }) => {
  function convertBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} bytes`;
    } else if (bytes < 1024 * 1024) {
      const kilobytes = bytes / 1024;
      return `${kilobytes.toFixed(2)} KB`;
    } else {
      const megabytes = bytes / (1024 * 1024);
      return `${megabytes.toFixed(2)} MB`;
    }
  }
  const handleFilePreview = () => {
    window.open(fileUrl, "_blank");
  };

  return (
    <button
      className="w-full md:max-w-72 flex border-2 border-basePrimaryDark rounded-md"
      onClick={handleFilePreview}
    >
      <span className="w-fit text-lg h-full bg-baseSecondary rounded-l-md text-basePrimaryDark p-2 border-r-2 border-y-basePrimaryDark items-center flex">
        {fileExtension?.toUpperCase()}
      </span>
      <div className="flex flex-col items-start px-2 w-fit">
        <p className="pt-1 text-start font-semibold overflow-hidden flex flex-wrap break-all">
          {fileName?.length! < 50 ? fileName : fileName?.slice(0, 50)}
        </p>
        <p>{convertBytes(fileSize!)}</p>
      </div>
    </button>
  );
};
