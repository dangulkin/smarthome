import { useCallback } from "react";

import { BLEND_MODES } from "../../config/fire.js";

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

export function FireSettingsPanel({ settings, onSettingsChange, onReset, previewScale, onPreviewScaleChange, viewSettings, onViewSettingsChange }) {
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
