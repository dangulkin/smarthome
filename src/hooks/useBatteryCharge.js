import { useEffect, useState } from "react";

export function getNextBatteryLevel(currentBattery, maxBattery) {
  return Math.min(maxBattery, currentBattery + 1);
}

export function useBatteryCharge({ startsWhenActive, initial, max, firstDelayMs, intervalMs }) {
  const [batteryLevel, setBatteryLevel] = useState(initial);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (startsWhenActive) {
      setHasStarted(true);
    }
  }, [startsWhenActive]);

  useEffect(() => {
    if (!hasStarted) {
      return undefined;
    }

    let chargeInterval;
    const clearChargeInterval = () => {
      if (chargeInterval) {
        window.clearInterval(chargeInterval);
      }
    };

    const incrementBattery = () => {
      setBatteryLevel((currentBattery) => {
        if (currentBattery >= max) {
          clearChargeInterval();
          return currentBattery;
        }

        const nextBattery = getNextBatteryLevel(currentBattery, max);
        if (nextBattery >= max) {
          clearChargeInterval();
        }

        return nextBattery;
      });
    };

    const firstChargeTimer = window.setTimeout(() => {
      incrementBattery();
      chargeInterval = window.setInterval(incrementBattery, intervalMs);
    }, firstDelayMs);

    return () => {
      window.clearTimeout(firstChargeTimer);
      clearChargeInterval();
    };
  }, [firstDelayMs, hasStarted, intervalMs, max]);

  return { batteryLevel, hasStarted };
}
