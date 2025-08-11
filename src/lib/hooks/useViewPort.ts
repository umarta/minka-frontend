import { useEffect, useState } from "react";

export const useViewports = () => {
  const [isExtraNarrowScreen, setIsExtraNarrowScreen] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [innerWidth, setInnerWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsExtraNarrowScreen(window.innerWidth <= 560);
      setIsNarrowScreen(window.innerWidth <= 768);
      setIsMobile(window.innerWidth <= 850);
      setIsTablet(window.innerWidth <= 1050);
      setInnerWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      setIsExtraNarrowScreen(window.innerWidth <= 560);
      setIsNarrowScreen(window.innerWidth <= 768);
      setIsMobile(window.innerWidth <= 850);
      setIsTablet(window.innerWidth <= 1050);
      setInnerWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return {
    innerWidth,
    isMobile,
    isTablet,
    isNarrowScreen,
    isExtraNarrowScreen,
  };
};
