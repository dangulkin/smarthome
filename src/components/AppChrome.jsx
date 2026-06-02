import { BASE_URL } from "../config/devices.js";

function DotIcon({ variant }) {
  return <div className={`dock-led-icon ${variant}`} aria-hidden="true">{variant === "minus" ? "=" : "+"}</div>;
}

export function BottomControl({ intensity }) {
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

export function IosStatusBar() {
  return (
    <div className="ios-status-bar" aria-hidden="true">
      <div className="ios-status-time">9:41</div>
      <img className="ios-status-image" src={`${BASE_URL}images/Levels.svg`} alt="" />
    </div>
  );
}

export function HomeIndicator() {
  return <div className="ios-home-indicator" aria-hidden="true" />;
}

export function DeviceMockup() {
  return <img className="device-mockup" src={`${BASE_URL}images/iPhone 16 Pro Max.png`} alt="" aria-hidden="true" />;
}

export function SettingsHint() {
  return (
    <div className="settings-hint" aria-hidden="true">
      <span className="settings-hint-text">Settings</span>
      <span className="settings-hint-key">⌘M</span>
    </div>
  );
}
