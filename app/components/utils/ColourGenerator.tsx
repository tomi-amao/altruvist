const dotColours = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "pink",
  "indigo",
  "orange",
  "teal",
  "cyan",
];

// Function to get a random colour based on the category name (will be consistent for same category)
const getColour = (category: string) => {
  const hash = category.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return dotColours[Math.abs(hash) % dotColours.length];
};

export default getColour;
