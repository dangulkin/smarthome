import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { normalizeTemperature, temperatureFromDrag, temperatureScale } from "./temperature.js";
import "./styles.css";

const INITIAL_TEMPERATURE = 23;
const BASE_URL = import.meta.env.BASE_URL;
const HOT_FLAME_LOOP_SECONDS = 0.95;
const COLD_FLAME_LOOP_SECONDS = 2.8;

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

function FireArtwork({ intensity }) {
  const redPathRef = useRef(null);
  const orangePathRef = useRef(null);
  const goldPathRef = useRef(null);
  const coreRef = useRef(null);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    let animationFrame = 0;
    let previousTimeMs = null;
    let phase = 0;
    let smoothHeat = intensityRef.current;

    const redBase = [-8, 250, 78, 430, 14, 80, 166, 420, 89, -34, 262, 340, 254, 96, 344, 404, 390, -20];
    const orangeBase = [55, 330, 130, 498, 88, 105, 205, 430, 195, 210, 296, 506, 326, 138];
    const goldBase = [112, 438, 188, 530, 204, 248, 276, 502, 364, 350];

    const point = (base, index, amount, time, phase, motion) => {
      const activeAmount = amount * motion;
      const x = base[index] + Math.sin(time * 1.1 + phase) * activeAmount * 0.22;
      const y = base[index + 1] + Math.sin(time + phase) * activeAmount;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    };

    const render = (timeMs) => {
      const deltaSeconds = previousTimeMs === null ? 1 / 60 : Math.min((timeMs - previousTimeMs) / 1000, 0.064);
      previousTimeMs = timeMs;

      const targetHeat = intensityRef.current;
      const heatEase = 1 - Math.exp(-deltaSeconds / 0.16);
      smoothHeat += (targetHeat - smoothHeat) * heatEase;

      const loopSeconds = COLD_FLAME_LOOP_SECONDS - smoothHeat * (COLD_FLAME_LOOP_SECONDS - HOT_FLAME_LOOP_SECONDS);
      const motion = 0.36 + smoothHeat * 0.82;
      phase += deltaSeconds * ((Math.PI * 2) / loopSeconds);
      const time = phase;

      redPathRef.current?.setAttribute(
        "d",
        `M-18 648 L${point(redBase, 0, 32, time, 0.2, motion)} L${point(redBase, 2, -18, time, 1.1, motion)} L${point(redBase, 4, 44, time, 2.2, motion)} L${point(redBase, 6, -28, time, 3.1, motion)} L${point(redBase, 8, 40, time, 4.0, motion)} L${point(redBase, 10, -22, time, 4.7, motion)} L${point(redBase, 12, 30, time, 5.4, motion)} L${point(redBase, 14, -34, time, 6.1, motion)} L${point(redBase, 16, 38, time, 6.8, motion)} L426 648 Z`
      );

      orangePathRef.current?.setAttribute(
        "d",
        `M42 664 L${point(orangeBase, 0, -28, time, 0.9, motion)} L${point(orangeBase, 2, 24, time, 1.7, motion)} L${point(orangeBase, 4, 38, time, 2.6, motion)} L${point(orangeBase, 6, -30, time, 3.6, motion)} L${point(orangeBase, 8, 36, time, 4.4, motion)} L${point(orangeBase, 10, -24, time, 5.2, motion)} L${point(orangeBase, 12, 34, time, 6.0, motion)} L410 664 Z`
      );

      goldPathRef.current?.setAttribute(
        "d",
        `M46 670 L${point(goldBase, 0, -34, time, 1.3, motion)} L${point(goldBase, 2, 20, time, 2.1, motion)} L${point(goldBase, 4, 42, time, 3.2, motion)} L${point(goldBase, 6, -26, time, 4.1, motion)} L${point(goldBase, 8, 32, time, 5.0, motion)} L372 670 Z`
      );

      const corePulse = Math.sin(time + 1.3);
      const coreDrift = Math.sin(time * 1.1 + 2.1);
      if (coreRef.current) {
        coreRef.current.setAttribute("cx", (212 + coreDrift * 8 * motion).toFixed(1));
        coreRef.current.setAttribute("cy", (676 + corePulse * 7 * motion).toFixed(1));
        coreRef.current.setAttribute("rx", (172 + corePulse * 18 * motion).toFixed(1));
        coreRef.current.setAttribute("ry", (72 - corePulse * 7 * motion).toFixed(1));
        coreRef.current.setAttribute("opacity", (0.74 + (corePulse + 1) * 0.04).toFixed(2));
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <svg className="fire-artwork" viewBox="0 0 390 662" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="redFill" cx="45%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#ff180b" />
          <stop offset="55%" stopColor="#ff2b0b" />
          <stop offset="100%" stopColor="#ff2b0b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orangeFill" cx="52%" cy="63%" r="68%">
          <stop offset="0%" stopColor="#ff7b09" />
          <stop offset="58%" stopColor="#ff5208" />
          <stop offset="100%" stopColor="#ff5208" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="goldFill" cx="50%" cy="65%" r="65%">
          <stop offset="0%" stopColor="#fff1bd" />
          <stop offset="44%" stopColor="#ffb21a" />
          <stop offset="100%" stopColor="#ffb21a" stopOpacity="0" />
        </radialGradient>
        <filter id="blur90" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
        <filter id="blur60" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id="blur40" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>
      <path
        ref={redPathRef}
        className="flame-vector red"
        filter="url(#blur90)"
        fill="url(#redFill)"
        d="M-18 648 L-8 250 L78 430 L14 80 L166 420 L89 -34 L262 340 L254 96 L344 404 L390 -20 L426 648 Z"
      />
      <path
        ref={orangePathRef}
        className="flame-vector orange"
        filter="url(#blur60)"
        fill="url(#orangeFill)"
        d="M42 664 L55 330 L130 498 L88 105 L205 430 L195 210 L296 506 L326 138 L410 664 Z"
      />
      <path
        ref={goldPathRef}
        className="flame-vector gold"
        filter="url(#blur40)"
        fill="url(#goldFill)"
        d="M46 670 L112 438 L188 530 L204 248 L276 502 L364 350 L372 670 Z"
      />
      <ellipse ref={coreRef} className="flame-core-glow" filter="url(#blur40)" cx="212" cy="676" rx="172" ry="72" fill="#ffffff" opacity="0.78" />
    </svg>
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
      "--glow-opacity": 0.48 + intensity * 0.28,
      "--flame-scale-y": 0.72 + intensity * 0.78
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
        <FireArtwork intensity={intensity} />
        <div className="top-vignette" />
        <TemperatureRail temperature={temperature} />
      </section>

      <DeviceSelector />
      <BottomControl intensity={intensity} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<FireplaceApp />);
