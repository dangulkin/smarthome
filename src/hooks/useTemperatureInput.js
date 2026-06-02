import { useCallback, useEffect, useRef } from "react";

import { INITIAL_TEMPERATURE } from "../config/fire.js";
import { clampTemperature, temperatureFromDrag } from "../temperature.js";

export function useVerticalSwipe(setTemperature) {
  const startYRef = useRef(0);
  const startTemperatureRef = useRef(INITIAL_TEMPERATURE);
  const activePointerRef = useRef(null);

  const onPointerDown = useCallback((event, temperature) => {
    activePointerRef.current = event.pointerId;
    startYRef.current = event.clientY;
    startTemperatureRef.current = temperature;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event) => {
      if (activePointerRef.current !== event.pointerId) {
        return;
      }

      const translationY = event.clientY - startYRef.current;
      const pixelsPerDegree = Math.max(54, window.innerHeight * 0.105);
      setTemperature(temperatureFromDrag(startTemperatureRef.current, translationY, pixelsPerDegree));
    },
    [setTemperature]
  );

  const onPointerUp = useCallback((event) => {
    if (activePointerRef.current === event.pointerId) {
      activePointerRef.current = null;
    }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

export function usePageWheelTemperature(setTemperature) {
  const wheelDeltaRef = useRef(0);

  useEffect(() => {
    const onWheel = (event) => {
      if (event.target instanceof Element && event.target.closest(".fire-settings")) {
        return;
      }

      event.preventDefault();

      const pixelsPerDegree = Math.max(44, window.innerHeight * 0.075);
      wheelDeltaRef.current += event.deltaY;

      const steps = Math.trunc(wheelDeltaRef.current / pixelsPerDegree);
      if (steps === 0) {
        return;
      }

      wheelDeltaRef.current -= steps * pixelsPerDegree;
      setTemperature((currentTemperature) => clampTemperature(currentTemperature + steps));
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [setTemperature]);
}
