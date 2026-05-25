import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { normalizeTemperature, temperatureFromDrag, temperatureScale } from "./temperature.js";
import "./styles.css";

const INITIAL_TEMPERATURE = 23;
const BASE_URL = import.meta.env.BASE_URL;

function TemperatureRail({ temperature }) {
  const values = temperatureScale();
  const activeIndex = values.indexOf(temperature);

  return (
    <div className="temperature-drum" aria-label={`Temperature ${temperature} degrees`}>
      <div
        className="temperature-drum-track"
        style={{ transform: `translate3d(0, calc(50% - ${activeIndex} * var(--temperature-step)), 0)` }}
      >
        {values.map((value, index) => {
          const distance = Math.abs(index - activeIndex);
          const sizeClass = distance === 0 ? "size-0" : distance === 1 ? "size-1" : distance === 2 ? "size-2" : "size-3";
          const visibilityClass = distance <= 4 ? "visible" : "hidden";

          return (
            <div className={`temperature-label ${sizeClass} ${visibilityClass}`} key={value}>
              <span className="temperature-number">{value}</span>
              <span className="temperature-degree">°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeviceSelector() {
  return (
    <nav className="device-selector" aria-label="Device selector">
      <span className="device muted">Chair</span>
      <span className="device secondary">Lamp</span>
      <span className="device selected">Fireplace</span>
      <span className="device secondary">Teapot</span>
      <span className="device muted">Chair</span>
    </nav>
  );
}

function DotIcon({ variant }) {
  return <div className={`dock-led-icon ${variant}`} aria-hidden="true">{variant === "minus" ? "==" : "+"}</div>;
}

function BottomControl({ intensity }) {
  return (
    <div className="bottom-control">
      <DotIcon variant="minus" />
      <div className="flame-button" aria-hidden="true">
        <img
          className="flame-core"
          src={`${BASE_URL}images/alice.svg`}
          alt=""
          style={{ transform: `scale(${0.94 + intensity * 0.12})` }}
        />
      </div>
      <DotIcon variant="plus" />
    </div>
  );
}

function useVerticalSwipe(setTemperature) {
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

function FireplaceApp() {
  const [temperature, setTemperature] = useState(INITIAL_TEMPERATURE);
  const intensity = normalizeTemperature(temperature);
  const swipe = useVerticalSwipe(setTemperature);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_URL}sw.js`).catch(() => {});
    }
  }, []);

  const visualStyle = useMemo(
    () => ({
      "--heat": intensity,
      "--fire-scale": 0.86 + intensity * 0.34,
      "--fire-rise": `${10 + intensity * 15}%`,
      "--fire-speed": `${7.5 - intensity * 3.2}s`,
      "--glow-opacity": 0.55 + intensity * 0.34,
      "--panel-scale": 1 + intensity * 0.018
    }),
    [intensity]
  );

  return (
    <main
      className="app"
      style={visualStyle}
      onPointerDown={(event) => swipe.onPointerDown(event, temperature)}
      onPointerMove={swipe.onPointerMove}
      onPointerUp={swipe.onPointerUp}
      onPointerCancel={swipe.onPointerUp}
    >
      <section className="fire-panel" aria-label="Fireplace control">
        <div className="fire-gradient" />
        <div className="fire-blob blob-red" />
        <div className="fire-blob blob-gold" />
        <div className="fire-blob blob-ember" />
        <div className="top-vignette" />
        <TemperatureRail temperature={temperature} />
      </section>

      <DeviceSelector />
      <BottomControl intensity={intensity} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<FireplaceApp />);
