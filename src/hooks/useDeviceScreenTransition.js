import { useEffect, useMemo, useState } from "react";

import { buildVisibleScreens } from "../config/devices.js";

export function useDeviceScreenTransition(activeDeviceIndex, durationMs) {
  const [screenTransition, setScreenTransition] = useState({
    currentIndex: activeDeviceIndex,
    previousIndex: null,
    direction: "forward",
    sequence: 0
  });

  useEffect(() => {
    setScreenTransition((currentTransition) => {
      if (currentTransition.currentIndex === activeDeviceIndex) {
        return currentTransition;
      }

      return {
        currentIndex: activeDeviceIndex,
        previousIndex: currentTransition.currentIndex,
        direction: activeDeviceIndex >= currentTransition.currentIndex ? "forward" : "backward",
        sequence: currentTransition.sequence + 1
      };
    });
  }, [activeDeviceIndex]);

  useEffect(() => {
    if (screenTransition.previousIndex === null) {
      return undefined;
    }

    const transitionTimer = window.setTimeout(() => {
      setScreenTransition((currentTransition) => ({
        ...currentTransition,
        previousIndex: null
      }));
    }, durationMs);

    return () => window.clearTimeout(transitionTimer);
  }, [durationMs, screenTransition.previousIndex, screenTransition.currentIndex]);

  const visibleScreens = useMemo(() => buildVisibleScreens(screenTransition), [screenTransition]);

  return {
    direction: screenTransition.direction,
    isTransitioning: screenTransition.previousIndex !== null,
    transitionKey: screenTransition.sequence,
    visibleScreens
  };
}
