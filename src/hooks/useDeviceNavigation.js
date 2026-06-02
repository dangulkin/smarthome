import { useEffect } from "react";

import { clampTemperature } from "../temperature.js";

export function useDeviceNavigation({ canUseFireSettings, setActiveDeviceIndex, setShowSettings, setTemperature }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
        if (canUseFireSettings) {
          event.preventDefault();
          setShowSettings((isVisible) => !isVisible);
        }
        return;
      }

      if (event.target instanceof Element && event.target.closest(".fire-settings")) {
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowUp" ? 1 : -1;
        setTemperature((currentTemperature) => clampTemperature(currentTemperature + direction));
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        setActiveDeviceIndex((currentIndex) => currentIndex + direction);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUseFireSettings, setActiveDeviceIndex, setShowSettings, setTemperature]);
}
