import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { RiCheckLine } from "react-icons/ri";

import { OFF_TEMPERATURE, clampTemperature, normalizeTemperature, temperatureFromDrag, temperatureScale } from "./temperature.js";
import "./styles.css";

const INITIAL_TEMPERATURE = 23;
const BASE_URL = import.meta.env.BASE_URL;
const HOT_FLAME_LOOP_SECONDS = 0.95;
const COLD_FLAME_LOOP_SECONDS = 2.8;
const DEFAULT_PREVIEW_SCALE = 0.7;
const DEFAULT_FIRE_SETTINGS = {
  verticalSpeed: 5,
  horizontalSpeed: 1,
  verticalAmplitude: 1,
  horizontalAmplitude: 1,
  redColor: "#ff180b",
  orangeColor: "#ff7b09",
  goldColor: "#fff1bd",
  coreColor: "#ffffff",
  redBlur: 45,
  orangeBlur: 30,
  goldBlur: 20,
  blendMode: "hard-light",
  showRed: true,
  showOrange: true,
  showGold: true,
  showCore: true
};

const DEFAULT_VIEW_SETTINGS = {
  showDevice: true,
  showStatusBar: true,
  showHomeBar: true,
  pageBackground: "#141416"
};

const DEVICES = ["Humidifier", "Lamp", "Fireplace", "Gamepad", "Teapot", "AC"];
const SWITCHABLE_DEVICES = ["Fireplace", "Gamepad"];
const GAMEPAD_DUST = {
  far: [
    [10, 18, 0],
    [28, 42, 1.8],
    [49, 22, 3.2],
    [68, 48, 0.9],
    [88, 30, 2.7]
  ],
  mid: [
    [16, 34, 0.6],
    [34, 16, 2.4],
    [54, 46, 1.1],
    [73, 22, 3.5],
    [91, 42, 1.9]
  ],
  near: [
    [22, 50, 1.3],
    [42, 28, 3.1],
    [63, 54, 0.4],
    [82, 18, 2.2]
  ]
};
const BLEND_MODES = ["hard-light", "screen", "plus-lighter", "lighten", "normal", "overlay"];
const DEVICE_SCREEN_TRANSITION_MS = 520;

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

function TemperatureRail({ temperature, shutdownCountdown }) {
  const values = temperatureScale();
  const activeIndex = values.indexOf(temperature);
  const labelText = temperature === OFF_TEMPERATURE ? "OFF" : `${temperature} degrees`;

  return (
    <div className="temperature-drum" aria-label={`Temperature ${labelText}`}>
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

          const isOff = value === OFF_TEMPERATURE;
          const showCountdown = isOff && distance === 0 && shutdownCountdown !== null;

          return (
            <div className={`temperature-label ${sizeClass} ${visibilityClass} ${isOff ? "off" : ""}`} key={value}>
              {showCountdown ? (
                <span className="shutdown-countdown" aria-hidden="true">
                  {shutdownCountdown === "check" ? <RiCheckLine className="shutdown-check" /> : shutdownCountdown}
                </span>
              ) : null}
              <span className="temperature-number">{isOff ? "OFF" : value}</span>
              {isOff ? null : <span className="temperature-degree">°</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeviceSelector({ activeDevice }) {
  const activeIndex = DEVICES.indexOf(activeDevice);

  return (
    <nav className="device-selector" aria-label="Device selector">
      {DEVICES.map((device, index) => {
        const distance = index - activeIndex;
        const absDistance = Math.abs(distance);
        const className = absDistance === 0 ? "selected" : absDistance === 1 ? "secondary" : absDistance === 2 ? "tertiary" : "muted";
        const distanceClass = absDistance >= 3 ? "far" : "";

        return (
          <span className={`device ${className} ${distanceClass}`} style={{ "--device-offset": distance }} key={device}>
            {device}
          </span>
        );
      })}
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

function GamepadScreen() {
  return (
    <section className="gamepad-panel" aria-label="Gamepad control">
      <div className="gamepad-green-glow" />
      <svg className="gamepad-glow-peaks" viewBox="0 0 390 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="gamepad-peak peak-back" d="M-20 330 L42 194 L84 300 L132 150 L174 306 L224 184 L270 310 L336 172 L414 330 Z" />
        <path className="gamepad-peak peak-front" d="M4 326 L56 252 L98 320 L154 206 L194 318 L238 226 L294 320 L352 240 L404 326 Z" />
      </svg>
      <div className="gamepad-dust" aria-hidden="true">
        {Object.entries(GAMEPAD_DUST).map(([depth, particles]) => (
          <div className={`gamepad-dust-layer ${depth}`} key={depth}>
            {particles.map(([left, bottom, delay], index) => (
              <span
                className="gamepad-dust-particle"
                style={{ "--dust-left": `${left}%`, "--dust-bottom": `${bottom}px`, "--dust-delay": `${delay}s` }}
                key={`${depth}-${index}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="gamepad-device-wrap">
        <img className="gamepad-device" src={`${BASE_URL}images/gamepad.png`} alt="" />
      </div>
      <div className="gamepad-device-light-layer" aria-hidden="true">
        <div className="gamepad-device-light left" />
        <div className="gamepad-device-light center" />
        <div className="gamepad-device-light right" />
      </div>
      <div className="gamepad-copy">
        <p>
          You&apos;ve played <span className="gamepad-led-badge">33 HRS</span> this week.
        </p>
        <p>Block the gamepad for 24 hrs.</p>
        <p>
          Better <span className="gamepad-led-badge">READ A BOOK</span>
        </p>
      </div>
      <div className="gamepad-battery" aria-label="Battery level 55 percent">
        <img className="gamepad-battery-icon" src={`${BASE_URL}images/battery.svg`} alt="" />
        <span>55%</span>
      </div>
    </section>
  );
}

function FireplaceScreen({ intensity, fireSettings, isFireOff, shutdownCountdown, temperature }) {
  return (
    <section className="fire-panel" aria-label="Fireplace control">
      <FireArtwork intensity={intensity} settings={fireSettings} isHidden={isFireOff} />
      <div className="top-vignette" />
      <TemperatureRail temperature={temperature} shutdownCountdown={shutdownCountdown} />
    </section>
  );
}

function DeviceScreen({ device, className, intensity, fireSettings, isFireOff, shutdownCountdown, temperature }) {
  const screenClassName = ["device-screen", className].filter(Boolean).join(" ");

  return (
    <div className={screenClassName}>
      {device === "Fireplace" ? (
        <FireplaceScreen
          intensity={intensity}
          fireSettings={fireSettings}
          isFireOff={isFireOff}
          shutdownCountdown={shutdownCountdown}
          temperature={temperature}
        />
      ) : (
        <GamepadScreen />
      )}
    </div>
  );
}

function IosStatusBar() {
  return (
    <div className="ios-status-bar" aria-hidden="true">
      <div className="ios-status-time">9:41</div>
      <img className="ios-status-image" src={`${BASE_URL}images/Levels.svg`} alt="" />
    </div>
  );
}

function HomeIndicator() {
  return <div className="ios-home-indicator" aria-hidden="true" />;
}

function DeviceMockup() {
  return <img className="device-mockup" src={`${BASE_URL}images/iPhone 16 Pro Max.png`} alt="" aria-hidden="true" />;
}

function SettingsHint() {
  return (
    <div className="settings-hint" aria-hidden="true">
      <span className="settings-hint-text">Settings</span>
      <span className="settings-hint-key">⌘M</span>
    </div>
  );
}

function FireArtwork({ intensity, settings, isHidden }) {
  const redPathRef = useRef(null);
  const orangePathRef = useRef(null);
  const goldPathRef = useRef(null);
  const coreRef = useRef(null);
  const intensityRef = useRef(intensity);
  const settingsRef = useRef(settings);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let animationFrame = 0;
    let previousTimeMs = null;
    let phase = 0;
    let horizontalPhase = 0;
    let smoothHeat = intensityRef.current;

    const redBase = [-8, 250, 78, 430, 14, 80, 166, 420, 89, -34, 262, 340, 254, 96, 344, 404, 390, -20];
    const orangeBase = [55, 330, 130, 498, 88, 105, 205, 430, 195, 210, 296, 506, 326, 138];
    const goldBase = [70, 454, 124, 566, 164, 382, 192, 530, 216, 248, 258, 512, 302, 398, 340, 520, 366, 332];

    const point = (base, index, amount, verticalTime, horizontalTime, phase, motion, currentSettings) => {
      const verticalAmount = amount * motion * currentSettings.verticalAmplitude;
      const horizontalAmount = amount * motion * 0.22 * currentSettings.horizontalAmplitude;
      const x = base[index] + Math.sin(horizontalTime * 1.1 + phase) * horizontalAmount;
      const y = base[index + 1] + Math.sin(verticalTime + phase) * verticalAmount;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    };

    const render = (timeMs) => {
      const deltaSeconds = previousTimeMs === null ? 1 / 60 : Math.min((timeMs - previousTimeMs) / 1000, 0.064);
      previousTimeMs = timeMs;

      const targetHeat = intensityRef.current;
      const currentSettings = settingsRef.current;
      const heatEase = 1 - Math.exp(-deltaSeconds / 0.16);
      smoothHeat += (targetHeat - smoothHeat) * heatEase;

      const loopSeconds = COLD_FLAME_LOOP_SECONDS - smoothHeat * (COLD_FLAME_LOOP_SECONDS - HOT_FLAME_LOOP_SECONDS);
      const motion = 0.36 + smoothHeat * 0.82;
      phase += deltaSeconds * ((Math.PI * 2) / loopSeconds) * currentSettings.verticalSpeed;
      horizontalPhase += deltaSeconds * ((Math.PI * 2) / loopSeconds) * currentSettings.horizontalSpeed;
      const verticalTime = phase;
      const horizontalTime = horizontalPhase;

      redPathRef.current?.setAttribute(
        "d",
        `M-18 648 L${point(redBase, 0, 32, verticalTime, horizontalTime, 0.2, motion, currentSettings)} L${point(redBase, 2, -18, verticalTime, horizontalTime, 1.1, motion, currentSettings)} L${point(redBase, 4, 44, verticalTime, horizontalTime, 2.2, motion, currentSettings)} L${point(redBase, 6, -28, verticalTime, horizontalTime, 3.1, motion, currentSettings)} L${point(redBase, 8, 40, verticalTime, horizontalTime, 4.0, motion, currentSettings)} L${point(redBase, 10, -22, verticalTime, horizontalTime, 4.7, motion, currentSettings)} L${point(redBase, 12, 30, verticalTime, horizontalTime, 5.4, motion, currentSettings)} L${point(redBase, 14, -34, verticalTime, horizontalTime, 6.1, motion, currentSettings)} L${point(redBase, 16, 38, verticalTime, horizontalTime, 6.8, motion, currentSettings)} L426 648 Z`
      );

      orangePathRef.current?.setAttribute(
        "d",
        `M42 664 L${point(orangeBase, 0, -28, verticalTime, horizontalTime, 0.9, motion, currentSettings)} L${point(orangeBase, 2, 24, verticalTime, horizontalTime, 1.7, motion, currentSettings)} L${point(orangeBase, 4, 38, verticalTime, horizontalTime, 2.6, motion, currentSettings)} L${point(orangeBase, 6, -30, verticalTime, horizontalTime, 3.6, motion, currentSettings)} L${point(orangeBase, 8, 36, verticalTime, horizontalTime, 4.4, motion, currentSettings)} L${point(orangeBase, 10, -24, verticalTime, horizontalTime, 5.2, motion, currentSettings)} L${point(orangeBase, 12, 34, verticalTime, horizontalTime, 6.0, motion, currentSettings)} L410 664 Z`
      );

      goldPathRef.current?.setAttribute(
        "d",
        `M22 670 L${point(goldBase, 0, -28, verticalTime, horizontalTime, 1.3, motion, currentSettings)} L${point(goldBase, 2, 18, verticalTime, horizontalTime, 1.8, motion, currentSettings)} L${point(goldBase, 4, -30, verticalTime, horizontalTime, 2.3, motion, currentSettings)} L${point(goldBase, 6, 22, verticalTime, horizontalTime, 3.0, motion, currentSettings)} L${point(goldBase, 8, 44, verticalTime, horizontalTime, 3.6, motion, currentSettings)} L${point(goldBase, 10, -26, verticalTime, horizontalTime, 4.2, motion, currentSettings)} L${point(goldBase, 12, -22, verticalTime, horizontalTime, 4.9, motion, currentSettings)} L${point(goldBase, 14, 24, verticalTime, horizontalTime, 5.5, motion, currentSettings)} L${point(goldBase, 16, -28, verticalTime, horizontalTime, 6.1, motion, currentSettings)} L348 670 Z`
      );

      const corePulse = Math.sin(verticalTime + 1.3);
      const coreDrift = Math.sin(horizontalTime * 1.1 + 2.1);
      if (coreRef.current) {
        coreRef.current.setAttribute("cx", (212 + coreDrift * 8 * motion * currentSettings.horizontalAmplitude).toFixed(1));
        coreRef.current.setAttribute("cy", (676 + corePulse * 7 * motion * currentSettings.verticalAmplitude).toFixed(1));
        coreRef.current.setAttribute("rx", (172 + corePulse * 18 * motion * currentSettings.horizontalAmplitude).toFixed(1));
        coreRef.current.setAttribute("ry", (72 - corePulse * 7 * motion * currentSettings.verticalAmplitude).toFixed(1));
        coreRef.current.setAttribute("opacity", (0.74 + (corePulse + 1) * 0.04).toFixed(2));
      }

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <svg
      className={`fire-artwork ${isHidden ? "hidden" : ""}`}
      viewBox="0 0 390 662"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ "--fire-blend-mode": settings.blendMode }}
    >
      <defs>
        <filter id="blur90" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation={settings.redBlur} />
        </filter>
        <filter id="blur60" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation={settings.orangeBlur} />
        </filter>
        <filter id="blur40" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation={settings.goldBlur} />
        </filter>
      </defs>
      <g className="fire-shapes">
        <path
          ref={redPathRef}
          className="flame-vector red"
          filter="url(#blur90)"
          fill={settings.redColor}
          style={{ display: settings.showRed ? undefined : "none" }}
          d="M-18 648 L-8 250 L78 430 L14 80 L166 420 L89 -34 L262 340 L254 96 L344 404 L390 -20 L426 648 Z"
        />
        <path
          ref={orangePathRef}
          className="flame-vector orange"
          filter="url(#blur60)"
          fill={settings.orangeColor}
          style={{ display: settings.showOrange ? undefined : "none" }}
          d="M42 664 L55 330 L130 498 L88 105 L205 430 L195 210 L296 506 L326 138 L410 664 Z"
        />
        <path
          ref={goldPathRef}
          className="flame-vector gold"
          filter="url(#blur40)"
          fill={settings.goldColor}
          style={{ display: settings.showGold ? undefined : "none" }}
          d="M22 670 L70 454 L124 566 L164 382 L192 530 L216 248 L258 512 L302 398 L340 520 L366 332 L348 670 Z"
        />
        <ellipse
          ref={coreRef}
          className="flame-core-glow"
          filter="url(#blur40)"
          cx="212"
          cy="676"
          rx="172"
          ry="72"
          fill={settings.coreColor}
          opacity="0.78"
          style={{ display: settings.showCore ? undefined : "none" }}
        />
      </g>
    </svg>
  );
}

function RangeControl({ label, min, max, step, value, onChange, suffix = "" }) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <label className="settings-field">
      <span className="settings-label">{label}</span>
      <span className="settings-row">
        <input
          className="settings-range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          style={{ "--range-progress": `${progress}%` }}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input className="settings-number" type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        {suffix ? <span className="settings-suffix">{suffix}</span> : null}
      </span>
    </label>
  );
}

function ColorControl({ label, value, onChange }) {
  return (
    <label className="settings-color-field">
      <span className="settings-label">{label}</span>
      <span className="settings-color-row">
        <input className="settings-color" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input className="settings-hex" type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}

function EyeIcon({ visible }) {
  return (
    <svg className="settings-eye-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
      {!visible ? <path className="settings-eye-slash" d="M4 4l16 16" /> : null}
    </svg>
  );
}

function LayerToggle({ label, color, visible, onToggle }) {
  return (
    <div className="settings-layer-row">
      <span className="settings-layer-swatch" style={{ background: color }} />
      <span className="settings-layer-name">{label}</span>
      <button className="settings-eye-button" type="button" aria-pressed={visible} aria-label={`${visible ? "Hide" : "Show"} ${label}`} onClick={onToggle}>
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}

function SettingsToggle({ label, visible, onToggle }) {
  return (
    <div className="settings-layer-row">
      <span className="settings-layer-swatch neutral" />
      <span className="settings-layer-name">{label}</span>
      <button className="settings-eye-button" type="button" aria-pressed={visible} aria-label={`${visible ? "Hide" : "Show"} ${label}`} onClick={onToggle}>
        <EyeIcon visible={visible} />
      </button>
    </div>
  );
}

function FireSettingsPanel({ settings, onSettingsChange, onReset, previewScale, onPreviewScaleChange, viewSettings, onViewSettingsChange }) {
  const updateSetting = useCallback(
    (key, value) => {
      onSettingsChange((current) => ({ ...current, [key]: value }));
    },
    [onSettingsChange]
  );

  const updateViewSetting = useCallback(
    (key, value) => {
      onViewSettingsChange((current) => ({ ...current, [key]: value }));
    },
    [onViewSettingsChange]
  );

  return (
    <aside className="fire-settings" aria-label="Fire animation settings">
      <div className="settings-header">
        <div>
          <h1>Fire settings</h1>
          <p>Animation tuning</p>
        </div>
        <button className="settings-reset" type="button" onClick={onReset}>Reset</button>
      </div>

      <div className="settings-scroll">
        <section className="settings-section">
          <h2>View</h2>
          <SettingsToggle label="Device mockup" visible={viewSettings.showDevice} onToggle={() => updateViewSetting("showDevice", !viewSettings.showDevice)} />
          <SettingsToggle label="Status bar" visible={viewSettings.showStatusBar} onToggle={() => updateViewSetting("showStatusBar", !viewSettings.showStatusBar)} />
          <SettingsToggle label="Home bar" visible={viewSettings.showHomeBar} onToggle={() => updateViewSetting("showHomeBar", !viewSettings.showHomeBar)} />
          <ColorControl label="Page background" value={viewSettings.pageBackground} onChange={(value) => updateViewSetting("pageBackground", value)} />
        </section>

        <section className="settings-section">
          <h2>Layers</h2>
          <LayerToggle label="Red shape" color={settings.redColor} visible={settings.showRed} onToggle={() => updateSetting("showRed", !settings.showRed)} />
          <LayerToggle label="Orange shape" color={settings.orangeColor} visible={settings.showOrange} onToggle={() => updateSetting("showOrange", !settings.showOrange)} />
          <LayerToggle label="Gold shape" color={settings.goldColor} visible={settings.showGold} onToggle={() => updateSetting("showGold", !settings.showGold)} />
          <LayerToggle label="Core ellipse" color={settings.coreColor} visible={settings.showCore} onToggle={() => updateSetting("showCore", !settings.showCore)} />
        </section>

        <section className="settings-section">
          <h2>Preview</h2>
          <RangeControl label="Prototype scale" min={0.45} max={1} step={0.01} value={previewScale} onChange={onPreviewScaleChange} suffix="x" />
        </section>

        <section className="settings-section">
          <h2>Motion</h2>
          <RangeControl label="Vertical speed" min={0.2} max={10} step={0.1} value={settings.verticalSpeed} onChange={(value) => updateSetting("verticalSpeed", value)} suffix="x" />
          <RangeControl label="Horizontal speed" min={0.2} max={10} step={0.1} value={settings.horizontalSpeed} onChange={(value) => updateSetting("horizontalSpeed", value)} suffix="x" />
          <RangeControl label="Vertical amplitude" min={0} max={2} step={0.05} value={settings.verticalAmplitude} onChange={(value) => updateSetting("verticalAmplitude", value)} suffix="x" />
          <RangeControl label="Horizontal amplitude" min={0} max={2} step={0.05} value={settings.horizontalAmplitude} onChange={(value) => updateSetting("horizontalAmplitude", value)} suffix="x" />
        </section>

        <section className="settings-section">
          <h2>Blur</h2>
          <RangeControl label="Red shape" min={0} max={90} step={1} value={settings.redBlur} onChange={(value) => updateSetting("redBlur", value)} suffix="px" />
          <RangeControl label="Orange shape" min={0} max={90} step={1} value={settings.orangeBlur} onChange={(value) => updateSetting("orangeBlur", value)} suffix="px" />
          <RangeControl label="Gold shape" min={0} max={90} step={1} value={settings.goldBlur} onChange={(value) => updateSetting("goldBlur", value)} suffix="px" />
        </section>

        <section className="settings-section">
          <h2>Color</h2>
          <ColorControl label="Red shape" value={settings.redColor} onChange={(value) => updateSetting("redColor", value)} />
          <ColorControl label="Orange shape" value={settings.orangeColor} onChange={(value) => updateSetting("orangeColor", value)} />
          <ColorControl label="Gold shape" value={settings.goldColor} onChange={(value) => updateSetting("goldColor", value)} />
          <ColorControl label="Core ellipse" value={settings.coreColor} onChange={(value) => updateSetting("coreColor", value)} />
        </section>

        <section className="settings-section">
          <h2>Blend</h2>
          <label className="settings-field">
            <span className="settings-label">Mode</span>
            <select className="settings-select" value={settings.blendMode} onChange={(event) => updateSetting("blendMode", event.target.value)}>
              {BLEND_MODES.map((mode) => (
                <option value={mode} key={mode}>{mode}</option>
              ))}
            </select>
          </label>
        </section>
      </div>
    </aside>
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

function usePageWheelTemperature(setTemperature) {
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

function FireplaceApp() {
  const [temperature, setTemperature] = useState(INITIAL_TEMPERATURE);
  const [fireSettings, setFireSettings] = useState(DEFAULT_FIRE_SETTINGS);
  const [viewSettings, setViewSettings] = useState(DEFAULT_VIEW_SETTINGS);
  const [previewScale, setPreviewScale] = useState(getInitialPreviewScale);
  const [showSettings, setShowSettings] = useState(false);
  const [activeDevice, setActiveDevice] = useState("Fireplace");
  const [screenTransition, setScreenTransition] = useState({ current: "Fireplace", previous: null, direction: "forward" });
  const [lastHeatTemperature, setLastHeatTemperature] = useState(INITIAL_TEMPERATURE);
  const [isFireOff, setIsFireOff] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(null);
  const [previewCursor, setPreviewCursor] = useState({ x: 0, y: 0, visible: false });
  const intensity = normalizeTemperature(isFireOff ? OFF_TEMPERATURE : lastHeatTemperature);
  const swipe = useVerticalSwipe(setTemperature);
  usePageWheelTemperature(setTemperature);

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

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setShowSettings((isVisible) => !isVisible);
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
        setActiveDevice((currentDevice) => {
          const currentIndex = SWITCHABLE_DEVICES.indexOf(currentDevice);
          const fallbackIndex = 0;
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const nextIndex = (currentIndex === -1 ? fallbackIndex : currentIndex) + direction;
          const clampedIndex = Math.min(SWITCHABLE_DEVICES.length - 1, Math.max(0, nextIndex));
          return SWITCHABLE_DEVICES[clampedIndex];
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setScreenTransition((currentTransition) => {
      if (currentTransition.current === activeDevice) {
        return currentTransition;
      }

      const previousIndex = SWITCHABLE_DEVICES.indexOf(currentTransition.current);
      const activeIndex = SWITCHABLE_DEVICES.indexOf(activeDevice);
      const direction = activeIndex >= previousIndex ? "forward" : "backward";

      return {
        current: activeDevice,
        previous: currentTransition.current,
        direction
      };
    });
  }, [activeDevice]);

  useEffect(() => {
    if (screenTransition.previous === null) {
      return undefined;
    }

    const transitionTimer = window.setTimeout(() => {
      setScreenTransition((currentTransition) => ({
        ...currentTransition,
        previous: null
      }));
    }, DEVICE_SCREEN_TRANSITION_MS);

    return () => window.clearTimeout(transitionTimer);
  }, [screenTransition.previous, screenTransition.current]);

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

  const visibleScreens = useMemo(() => {
    if (!screenTransition.previous) {
      return [{ device: screenTransition.current, className: "" }];
    }

    if (screenTransition.direction === "backward") {
      return [
        { device: screenTransition.current, className: "is-entering" },
        { device: screenTransition.previous, className: "is-exiting" }
      ];
    }

    return [
      { device: screenTransition.previous, className: "is-exiting" },
      { device: screenTransition.current, className: "is-entering" }
    ];
  }, [screenTransition.current, screenTransition.direction, screenTransition.previous]);

  const onPreviewPointerMove = useCallback((event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    document.body.classList.add("preview-cursor-active");
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      visible: true
    });
  }, []);

  const onPreviewPointerLeave = useCallback(() => {
    document.body.classList.remove("preview-cursor-active");
    setPreviewCursor((current) => ({ ...current, visible: false }));
  }, []);

  useEffect(() => {
    return () => document.body.classList.remove("preview-cursor-active");
  }, []);

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
            <div className={`device-screen-stack transition-${screenTransition.direction} ${screenTransition.previous ? "is-transitioning" : ""}`}>
              <div className="device-screen-track">
                {visibleScreens.map((screen) => (
                  <DeviceScreen
                    key={`${screen.device}-${screen.className || "active"}`}
                    device={screen.device}
                    className={screen.className}
                    intensity={intensity}
                    fireSettings={fireSettings}
                    isFireOff={isFireOff}
                    shutdownCountdown={shutdownCountdown}
                    temperature={temperature}
                  />
                ))}
              </div>
            </div>

            <DeviceSelector activeDevice={activeDevice} />
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
      <SettingsHint />
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

createRoot(document.getElementById("root")).render(<FireplaceApp />);
