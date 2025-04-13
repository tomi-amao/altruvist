import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

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
  required?: boolean;
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
    background-color: white;
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
  }
  
  .pac-item-query {
    font-size: 14px;
    color: #333;
  }
  
  .pac-matched {
    font-weight: 600;
  }
  
  .pac-description {
    font-size: 12px;
    color: #666;
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
  required = false,
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
      const styleTag = document.createElement('style');
      styleTag.textContent = autocompleteStyles;
      document.head.appendChild(styleTag);
      
      return () => {
        // Clean up styles when component unmounts
        document.head.removeChild(styleTag);
      };
    }
  }, [isLoaded]);

  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    }
  }, [value]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || inputValue;
      
      onChange({
        address,
        lat,
        lng
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!e.target.value) {
      onChange(null);
    }
  };

  // Configure Autocomplete when it loads
  const handleAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    // Set the autocomplete options
    autocomplete.setOptions({
      // This provides more structure to the suggestions
      types: ['geocode', 'establishment'],
      // Optional: fields to return, limiting to what you need improves performance
      fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
    });
  };

  if (!isLoaded) {
    return (
      <div className="mb-4">
        <label className="block text-baseSecondary text-sm font-bold mb-2">
          {label} {required && <span className="text-dangerPrimary">*</span>}
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className={`${backgroundColour} w-full p-2 border ${
            serverValidationError ? "border-dangerPrimary" : "border-baseSecondaryLight"
          } rounded-md`}
          placeholder="Loading location search..."
          disabled
        />
        <p className="text-baseSecondary text-xs mt-1">{helperText}</p>
      </div>
    );
  }

  return (
    <div className="mb-4 relative">
      <label className="block text-baseSecondary text-sm font-bold mb-2">
        {label} {required && <span className="text-dangerPrimary">*</span>}
      </label>
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
            serverValidationError ? "border-dangerPrimary" : "border-baseSecondaryLight"
          } rounded-md`}
          placeholder={placeholder}
          id={`location-input-${location.pathname.replace(/\//g, '-')}`}
        />
      </Autocomplete>
      <p className="text-baseSecondary text-xs mt-1">{helperText}</p>
      {value && (
        <div className="text-xs text-baseSecondary mt-1">
          Selected coordinates: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}