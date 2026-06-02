import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { DEVICE_SCREEN_TYPES } from "../config/devices.js";
import { ChargeableDeviceScreen } from "../screens/chargeable-device/ChargeableDeviceScreen.jsx";
import { FireplaceScreen } from "../screens/fireplace/FireplaceScreen.jsx";

function PlaceholderDeviceScreen({ device }) {
  return (
    <section className="device-placeholder-panel" aria-label={`${device.label} control`}>
      <div className="device-placeholder-label">{device.label}</div>
    </section>
  );
}

function getScreenTransform(phase, isTransitioning, progress) {
  if (!isTransitioning || phase === "active") {
    return "scale(1)";
  }

  if (phase === "entering") {
    return `scale(${0.9 + progress * 0.1})`;
  }

  if (phase === "exiting") {
    return `scale(${1 - progress * 0.1})`;
  }

  return "scale(1)";
}

function DeviceScreen({ device, phase, isTransitioning, progress, batteryLevel, intensity, fireSettings, isFireOff, shutdownCountdown, temperature }) {
  const screenClassName = ["device-screen", phase === "active" ? "" : `is-${phase}`].filter(Boolean).join(" ");

  return (
    <div className={screenClassName} style={{ transform: getScreenTransform(phase, isTransitioning, progress) }}>
      {device.screenType === DEVICE_SCREEN_TYPES.FIREPLACE ? (
        <FireplaceScreen
          intensity={intensity}
          fireSettings={fireSettings}
          isFireOff={isFireOff}
          shutdownCountdown={shutdownCountdown}
          temperature={temperature}
        />
      ) : device.screenType === DEVICE_SCREEN_TYPES.CHARGEABLE ? (
        <ChargeableDeviceScreen device={device} batteryLevel={batteryLevel} />
      ) : (
        <PlaceholderDeviceScreen device={device} />
      )}
    </div>
  );
}

export function DeviceCarousel({
  direction,
  isTransitioning,
  durationMs,
  transitionKey,
  visibleScreens,
  batteryLevels,
  intensity,
  fireSettings,
  isFireOff,
  shutdownCountdown,
  temperature
}) {
  const [progress, setProgress] = useState(0);
  const [screenShift, setScreenShift] = useState("-478px");
  const stackRef = useRef(null);

  useLayoutEffect(() => {
    const updateScreenShift = () => {
      const stackWidth = stackRef.current?.getBoundingClientRect().width ?? 438;
      setScreenShift(`${-(stackWidth + 40)}px`);
    };

    updateScreenShift();
    window.addEventListener("resize", updateScreenShift);
    return () => window.removeEventListener("resize", updateScreenShift);
  }, []);

  useEffect(() => {
    if (!isTransitioning) {
      setProgress(0);
      return undefined;
    }

    const startTime = performance.now();
    const progressTimer = window.setInterval(() => {
      const elapsedMs = performance.now() - startTime;
      setProgress(Math.min(1, elapsedMs / durationMs));
    }, 16);

    setProgress(0);

    return () => window.clearInterval(progressTimer);
  }, [durationMs, isTransitioning, transitionKey]);

  const shiftPixels = Number.parseFloat(screenShift);
  const trackX = isTransitioning ? (direction === "backward" ? shiftPixels * (1 - progress) : shiftPixels * progress) : 0;
  const trackTransform = `translateX(${trackX}px)`;

  return (
    <div
      className={`device-screen-stack transition-${direction} ${isTransitioning ? "is-transitioning" : ""}`}
      ref={stackRef}
      style={{ "--device-screen-shift": screenShift }}
    >
      <div className="device-screen-track" key={transitionKey} style={{ transform: trackTransform }}>
        {visibleScreens.map((screen) => (
          <DeviceScreen
            key={`${screen.index}-${screen.phase}`}
            device={screen.device}
            phase={screen.phase}
            isTransitioning={isTransitioning}
            progress={progress}
            batteryLevel={batteryLevels[screen.device.id]}
            intensity={intensity}
            fireSettings={fireSettings}
            isFireOff={isFireOff}
            shutdownCountdown={shutdownCountdown}
            temperature={temperature}
          />
        ))}
      </div>
    </div>
  );
}
