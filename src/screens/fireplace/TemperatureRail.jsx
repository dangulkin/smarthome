import { RiCheckLine } from "react-icons/ri";

import { OFF_TEMPERATURE, temperatureScale } from "../../temperature.js";

export function TemperatureRail({ temperature, shutdownCountdown }) {
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
