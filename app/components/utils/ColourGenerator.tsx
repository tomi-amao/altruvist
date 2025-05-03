import React from "react";

// Direct mapping from CSS variables in tailwind.css
const COLORS = {
  red: "#F87171",
  blue: "#60A5FA",
  green: "#34D399",
  yellow: "#FBBF24",
  purple: "#A78BFA",
  pink: "#F472B6",
  indigo: "#818CF8",
  orange: "#FB923C",
  teal: "#2DD4BF",
  cyan: "#22D3EE",
};

type ColorKey = keyof typeof COLORS;

// Common category/skill to color mapping
const PREDEFINED = {
  Education: "blue",
  Health: "green",
  Environment: "teal",
  Community: "purple",
  Design: "purple",
  Technology: "indigo",
  Programming: "blue",
  Writing: "green",
} as Record<string, ColorKey>;

/**
 * Get a color value for any string input
 */
export const getColorValue = (input: string): string => {
  if (!input) return COLORS.blue;

  // Check for predefined matches (case insensitive)
  const normalized = input.trim().toLowerCase();

  // Check predefined mappings
  for (const [key, value] of Object.entries(PREDEFINED)) {
    if (key.toLowerCase() === normalized) {
      return COLORS[value];
    }
  }

  // Fallback to character code mapping
  const colorKeys = Object.keys(COLORS) as ColorKey[];
  const charCode = input.trim().charAt(0).toLowerCase().charCodeAt(0);
  const colorKey = colorKeys[charCode % colorKeys.length];

  return COLORS[colorKey];
};

/**
 * Simple dot component with inline styles
 */
export const ColorDot = ({
  value,
  className = "",
  size = "md",
}: {
  value: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeValue = {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
  }[size];

  return (
    <span
      style={{
        display: "inline-block",
        width: sizeValue,
        height: sizeValue,
        borderRadius: "9999px",
        backgroundColor: getColorValue(value),
      }}
      className={className}
      aria-hidden="true"
    />
  );
};

// Legacy support
const getColour = (input: string): ColorKey => {
  const normalized = input.trim().toLowerCase();

  for (const [key, value] of Object.entries(PREDEFINED)) {
    if (key.toLowerCase() === normalized) return value;
  }

  const colorKeys = Object.keys(COLORS) as ColorKey[];
  return colorKeys[
    input.trim().charAt(0).toLowerCase().charCodeAt(0) % colorKeys.length
  ];
};

export default getColour;
