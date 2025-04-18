import { useState, useEffect } from "react";

export function useViewport() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return { isMobile, isClient };
}
