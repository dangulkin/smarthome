import { useEffect, useState } from "react";

import { INITIAL_TEMPERATURE } from "../config/fire.js";
import { OFF_TEMPERATURE, normalizeTemperature } from "../temperature.js";

export function useFireShutdown(temperature) {
  const [lastHeatTemperature, setLastHeatTemperature] = useState(INITIAL_TEMPERATURE);
  const [isFireOff, setIsFireOff] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(null);

  useEffect(() => {
    if (temperature !== OFF_TEMPERATURE) {
      setLastHeatTemperature(temperature);
      setIsFireOff(false);
      setShutdownCountdown(null);
      return undefined;
    }

    setIsFireOff(false);
    setShutdownCountdown(3);
    const countdownTimers = [
      window.setTimeout(() => setShutdownCountdown(2), 1000),
      window.setTimeout(() => setShutdownCountdown(1), 2000),
      window.setTimeout(() => {
        setIsFireOff(true);
        setShutdownCountdown("check");
      }, 3000),
      window.setTimeout(() => setShutdownCountdown(null), 4000)
    ];

    return () => {
      countdownTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [temperature]);

  return {
    intensity: normalizeTemperature(isFireOff ? OFF_TEMPERATURE : lastHeatTemperature),
    isFireOff,
    shutdownCountdown
  };
}
