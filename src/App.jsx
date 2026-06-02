import { useEffect, useMemo, useState } from "react";

import { BottomControl, DeviceMockup, HomeIndicator, IosStatusBar, SettingsHint } from "./components/AppChrome.jsx";
import { DeviceCarousel } from "./components/DeviceCarousel.jsx";
import { DeviceSelector } from "./components/DeviceSelector.jsx";
import {
  DEFAULT_PREVIEW_SCALE,
  DEFAULT_VIEW_SETTINGS,
  DEVICE_SCREEN_TRANSITION_MS,
  DEVICE_SCREEN_TYPES,
  INITIAL_DEVICE_INDEX,
  getDeviceById,
  getDeviceByIndex
} from "./config/devices.js";
import { DEFAULT_FIRE_SETTINGS, INITIAL_TEMPERATURE } from "./config/fire.js";
import { useBatteryCharge } from "./hooks/useBatteryCharge.js";
import { useDeviceNavigation } from "./hooks/useDeviceNavigation.js";
import { useDeviceScreenTransition } from "./hooks/useDeviceScreenTransition.js";
import { useFireShutdown } from "./hooks/useFireShutdown.js";
import { usePreviewCursor } from "./hooks/usePreviewCursor.js";
import { useServiceWorker } from "./hooks/useServiceWorker.js";
import { usePageWheelTemperature, useVerticalSwipe } from "./hooks/useTemperatureInput.js";
import { FireSettingsPanel } from "./screens/fireplace/FireSettingsPanel.jsx";

function getInitialPreviewScale() {
  if (typeof window === "undefined" || window.innerWidth < 900) {
    return DEFAULT_PREVIEW_SCALE;
  }

  const availableWidth = window.innerWidth - 496;
  const availableHeight = window.innerHeight - 64;
  const fitScale = Math.min(1, availableWidth / 440, availableHeight / 956);
  const roundedFitScale = Math.floor(fitScale * 100) / 100;

  return Math.max(0.45, Math.min(DEFAULT_PREVIEW_SCALE, roundedFitScale));
}

export function App() {
  const [temperature, setTemperature] = useState(INITIAL_TEMPERATURE);
  const [fireSettings, setFireSettings] = useState(DEFAULT_FIRE_SETTINGS);
  const [viewSettings, setViewSettings] = useState(DEFAULT_VIEW_SETTINGS);
  const [previewScale, setPreviewScale] = useState(getInitialPreviewScale);
  const [showSettings, setShowSettings] = useState(false);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(INITIAL_DEVICE_INDEX);
  const activeDevice = getDeviceByIndex(activeDeviceIndex);
  const canUseFireSettings = activeDevice.screenType === DEVICE_SCREEN_TYPES.FIREPLACE;

  const gamepadDevice = getDeviceById("gamepad");
  const headphonesDevice = getDeviceById("headphones");
  const gamepadCharge = useBatteryCharge({
    startsWhenActive: activeDevice.id === "gamepad",
    ...gamepadDevice.battery
  });
  const headphonesCharge = useBatteryCharge({
    startsWhenActive: activeDevice.id === "headphones",
    ...headphonesDevice.battery
  });
  const batteryLevels = useMemo(
    () => ({
      gamepad: gamepadCharge.batteryLevel,
      headphones: headphonesCharge.batteryLevel
    }),
    [gamepadCharge.batteryLevel, headphonesCharge.batteryLevel]
  );

  const { direction, isTransitioning, transitionKey, visibleScreens } = useDeviceScreenTransition(activeDeviceIndex, DEVICE_SCREEN_TRANSITION_MS);
  const { intensity, isFireOff, shutdownCountdown } = useFireShutdown(temperature);
  const swipe = useVerticalSwipe(setTemperature);
  const { previewCursor, onPreviewPointerMove, onPreviewPointerLeave } = usePreviewCursor();

  useServiceWorker();
  usePageWheelTemperature(setTemperature);
  useDeviceNavigation({ canUseFireSettings, setActiveDeviceIndex, setShowSettings, setTemperature });

  useEffect(() => {
    if (!canUseFireSettings) {
      setShowSettings(false);
    }
  }, [canUseFireSettings]);

  const visualStyle = useMemo(
    () => ({
      "--heat": intensity,
      "--fire-scale": 0.92 + intensity * 0.2,
      "--fire-rise": `${7 + intensity * 13}%`,
      "--fire-speed": `${7.6 - intensity * 2.4}s`,
      "--glow-opacity": 0.48 + intensity * 0.28,
      "--flame-scale-y": 0.72 + intensity * 0.78
    }),
    [intensity]
  );

  return (
    <div className={`prototype-shell ${showSettings ? "settings-open" : ""}`} style={{ "--prototype-scale": previewScale, "--page-background": viewSettings.pageBackground }}>
      <div
        className={`prototype-stage ${previewCursor.visible ? "preview-cursor-active" : ""}`}
        onPointerMove={onPreviewPointerMove}
        onPointerLeave={onPreviewPointerLeave}
      >
        <div className="app-frame">
          <main
            className="app"
            style={visualStyle}
            onPointerDown={(event) => swipe.onPointerDown(event, temperature)}
            onPointerMove={swipe.onPointerMove}
            onPointerUp={swipe.onPointerUp}
            onPointerCancel={swipe.onPointerUp}
          >
            {viewSettings.showStatusBar ? <IosStatusBar /> : null}
            <DeviceCarousel
              direction={direction}
              isTransitioning={isTransitioning}
              durationMs={DEVICE_SCREEN_TRANSITION_MS}
              transitionKey={transitionKey}
              visibleScreens={visibleScreens}
              batteryLevels={batteryLevels}
              intensity={intensity}
              fireSettings={fireSettings}
              isFireOff={isFireOff}
              shutdownCountdown={shutdownCountdown}
              temperature={temperature}
            />
            <DeviceSelector activeDeviceIndex={activeDeviceIndex} />
            <BottomControl intensity={intensity} />
            {viewSettings.showHomeBar ? <HomeIndicator /> : null}
          </main>
        </div>
        {viewSettings.showDevice ? <DeviceMockup /> : null}
        <div
          className="preview-cursor"
          aria-hidden="true"
          style={{
            opacity: previewCursor.visible ? 1 : 0,
            transform: `translate3d(${previewCursor.x}px, ${previewCursor.y}px, 0) translate(-50%, -50%)`
          }}
        />
      </div>
      {canUseFireSettings ? <SettingsHint /> : null}
      {showSettings ? (
        <FireSettingsPanel
          settings={fireSettings}
          onSettingsChange={setFireSettings}
          onReset={() => setFireSettings(DEFAULT_FIRE_SETTINGS)}
          previewScale={previewScale}
          onPreviewScaleChange={setPreviewScale}
          viewSettings={viewSettings}
          onViewSettingsChange={setViewSettings}
        />
      ) : null}
    </div>
  );
}
