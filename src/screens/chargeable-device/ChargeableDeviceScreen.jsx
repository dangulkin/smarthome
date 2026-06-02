import { BASE_URL, GAMEPAD_DUST } from "../../config/devices.js";

function ChargeableCopy({ lines, className = "" }) {
  return (
    <div className={["gamepad-copy", className].filter(Boolean).join(" ")}>
      {lines.map((line, lineIndex) => (
        <p key={lineIndex}>
          {line.map((part, partIndex) => {
            if (typeof part === "string") {
              return part;
            }

            return <span className="gamepad-led-badge" key={partIndex}>{part.badge}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

function ChargeableEnergy() {
  return (
    <>
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
    </>
  );
}

export function ChargeableDeviceScreen({ device, batteryLevel }) {
  const isFullyCharged = batteryLevel >= device.battery.max;

  return (
    <section className={`gamepad-panel ${isFullyCharged ? "is-fully-charged" : ""}`} aria-label={device.ariaLabel}>
      {isFullyCharged ? null : <ChargeableEnergy />}
      <div className={["gamepad-device-wrap", device.deviceWrapClassName].filter(Boolean).join(" ")}>
        <img className={["gamepad-device", device.deviceClassName].filter(Boolean).join(" ")} src={device.asset} alt="" />
        {device.reflection && !isFullyCharged ? <span className="headphones-reflection" style={{ "--headphones-mask": `url("${device.asset}")` }} aria-hidden="true" /> : null}
      </div>
      <ChargeableCopy lines={device.copy} className={device.copyClassName} />
      <div className="gamepad-battery" aria-label={`Battery level ${batteryLevel} percent`}>
        <img className="gamepad-battery-icon" src={`${BASE_URL}images/battery.svg`} alt="" />
        <span>{batteryLevel}%</span>
        {isFullyCharged ? <span className="gamepad-battery-complete">READY</span> : null}
      </div>
    </section>
  );
}
