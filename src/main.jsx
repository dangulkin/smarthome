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
        style={{
          transform: `translate3d(0, calc(-${activeIndex + 0.5} * var(--temperature-step)), 0)`
        }}
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
      <span className="device muted">Humidifier</span>
      <span className="device secondary">Lamp</span>
      <span className="device selected">Fireplace</span>
      <span className="device secondary">Teapot</span>
      <span className="device muted">AC</span>
    </nav>
  );
}

function DotIcon({ variant }) {
  return <div className={`dock-led-icon ${variant}`} aria-hidden="true">{variant === "minus" ? "=" : "+"}</div>;
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

function FireCanvas({ intensity }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return undefined;
    }

    let frame = 0;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const drawBlob = (x, y, radius, colors) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      colors.forEach(([stop, color]) => gradient.addColorStop(stop, color));
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const heat = 0.75 + intensity * 0.55;
      const t = frame / 60;

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "screen";
      context.filter = "blur(22px)";

      drawBlob(
        width * (0.18 + Math.sin(t * 0.72) * 0.045),
        height * (0.69 + Math.cos(t * 0.6) * 0.025),
        width * (0.44 + Math.sin(t * 0.9) * 0.035) * heat,
        [
          [0, "rgba(255, 16, 10, 0.72)"],
          [0.45, "rgba(255, 72, 10, 0.42)"],
          [1, "rgba(255, 72, 10, 0)"]
        ]
      );

      drawBlob(
        width * (0.61 + Math.sin(t * 0.96 + 1.4) * 0.055),
        height * (0.78 + Math.cos(t * 0.82) * 0.035),
        width * (0.42 + Math.cos(t * 1.1) * 0.04) * heat,
        [
          [0, "rgba(255, 248, 202, 0.76)"],
          [0.28, "rgba(255, 178, 28, 0.48)"],
          [0.72, "rgba(255, 92, 8, 0.18)"],
          [1, "rgba(255, 92, 8, 0)"]
        ]
      );

      drawBlob(
        width * (0.79 + Math.cos(t * 0.52 + 0.8) * 0.04),
        height * (0.38 + Math.sin(t * 0.68) * 0.04),
        width * (0.36 + Math.sin(t * 0.74) * 0.03),
        [
          [0, "rgba(255, 120, 18, 0.34)"],
          [0.58, "rgba(112, 26, 10, 0.18)"],
          [1, "rgba(112, 26, 10, 0)"]
        ]
      );

      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      frame += 1;
      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [intensity]);

  return <canvas className="fire-canvas" ref={canvasRef} aria-hidden="true" />;
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
    if (import.meta.env.DEV && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      caches?.keys?.().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_URL}sw.js`).catch(() => {});
    }
  }, []);

  const visualStyle = useMemo(
    () => ({
      "--heat": intensity,
      "--fire-scale": 0.92 + intensity * 0.2,
      "--fire-rise": `${7 + intensity * 13}%`,
      "--fire-speed": `${7.6 - intensity * 2.4}s`,
      "--glow-opacity": 0.48 + intensity * 0.28
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
        <FireCanvas intensity={intensity} />
        <div className="top-vignette" />
        <TemperatureRail temperature={temperature} />
      </section>

      <DeviceSelector />
      <BottomControl intensity={intensity} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<FireplaceApp />);
