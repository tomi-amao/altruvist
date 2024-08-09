import fs from "fs";

export default function darkModeSet(mode) {
  mode = mode.toString();
  fs.writeFile("public/darkmode.txt", mode, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("File written successfully");
  });
}

export async function getDarkMode(): Promise<string | null> {
  try {
    const data = await fs.promises.readFile("public/darkmode.txt", "utf8");
    return data;
  } catch (err) {
    console.error("Error reading file:", err);
    return null; // Indicate error by returning null
  }
}

export function darkModeSetLocal(mode: string | boolean) {
  mode = mode.toString();

  if (typeof window !== "undefined") {
    // Perform localStorage action
    localStorage.setItem("mode", mode);
  }
}
export function darkModeGetLocal() {
  return localStorage.getItem("mode");
}
