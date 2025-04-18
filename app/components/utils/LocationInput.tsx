import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { useLocation } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";

// Define the structure for location data
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface LocationInputProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  backgroundColour?: string;
  serverValidationError?: boolean;
  GCPKey: string;
}

const libraries = ["places"] as ["places"];

// Custom styles for the Google Maps autocomplete dropdown
const autocompleteStyles = `
  .pac-container {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e0e0e0;
    margin-top: 4px;
    font-family: 'Poppins', sans-serif;
    background-color: #E8E8E8;
    padding: 8px 0;
  }
  
  .pac-item {
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .pac-item:hover {
    background-color: #f0f0f0;
  }
  
  .pac-item-selected {
    background-color: #e6e6e6;
  }
  
  .pac-icon {
    margin-right: 10px;
    color: #666;
  }
  
  .pac-item-query {
    font-size: 14px;
    color: #333;
    font-family: 'Poppins', sans-serif;
  }
  
  .pac-matched {
    font-weight: 600;
  }
  
  .pac-description {
    font-size: 12px;
    color: #666;
    font-family: 'Poppins', sans-serif;
  }
`;

export default function LocationInput({
  value,
  onChange,
  placeholder = "Enter a location",
  label = "Location",
  helperText = "Enter the location for this task",
  backgroundColour = "bg-basePrimary",
  serverValidationError = false,
  GCPKey,
}: LocationInputProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GCPKey,
    libraries,
  });

  const [inputValue, setInputValue] = useState(value?.address || "");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const location = useLocation();

  // Apply custom styles once the component mounts
  useEffect(() => {
    if (isLoaded) {
      // Add the custom CSS styles to the document head
      const styleTag = document.createElement("style");
      styleTag.textContent = autocompleteStyles;
      document.head.appendChild(styleTag);

      return () => {
        // Clean up styles when component unmounts
        if (styleTag.parentNode) {
          document.head.removeChild(styleTag);
        }
      };
    }
  }, [isLoaded]);

  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    }
  }, [value, inputValue]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();

    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || inputValue;

      onChange({
        address,
        lat,
        lng,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue) {
      // Instead of changing location to null (which would change type to REMOTE),
      // keep the location object but with empty values
      onChange({
        address: "",
        lat: 0,
        lng: 0,
      });
    }
  };

  // Configure Autocomplete when it loads
  const handleAutocompleteLoad = (
    autocomplete: google.maps.places.Autocomplete,
  ) => {
    autocompleteRef.current = autocomplete;

    // Set the autocomplete options
    autocomplete.setOptions({
      // This provides more structure to the suggestions
      types: ["geocode", "establishment"],
      // Optional: fields to return, limiting to what you need improves performance
      fields: [
        "address_components",
        "formatted_address",
        "geometry",
        "name",
        "place_id",
      ],
    });
  };

  if (!isLoaded) {
    return (
      <div className="mb-4">
        <label className="block text-baseSecondary text-sm font-bold mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className={`${backgroundColour} w-full p-2 border ${
              serverValidationError
                ? "border-dangerPrimary"
                : "border-baseSecondaryLight"
            } rounded-md transition-all duration-300`}
            placeholder="Loading location search..."
            disabled
          />
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
            <div className="h-4 w-4 rounded-full border-2 border-baseSecondary/50 border-t-transparent animate-spin"></div>
          </div>
        </div>
        <p className="text-baseSecondary text-xs mt-1 font-light">
          {helperText}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 relative">
      <label className="block text-baseSecondary text-sm font-bold mb-2">
        {label}
      </label>
      <div className="relative group">
        <Autocomplete
          onLoad={handleAutocompleteLoad}
          onPlaceChanged={handlePlaceSelect}
          restrictions={{ country: ["us", "ca", "gb"] }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className={`${backgroundColour} w-full p-2 border ${
              serverValidationError
                ? "border-dangerPrimary"
                : "border-baseSecondaryLight"
            } rounded-md focus:outline-none border-baseSecondary text-baseSecondary transition-all placeholder:text-baseSecondary/50 placeholder:text-sm duration-300`}
            placeholder={placeholder}
            id={`location-input-${location.pathname.replace(/\//g, "-")}`}
            aria-describedby={`${label}-helper`}
          />
        </Autocomplete>
      </div>
      <p
        className="text-baseSecondary text-xs mt-1 font-light"
        id={`${label}-helper`}
      >
        {helperText}
      </p>
      {value && value.lat !== 0 && value.lng !== 0 && (
        <div className="text-xs text-baseSecondary/70 mt-1 font-light">
          Selected coordinates: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
