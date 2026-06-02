import { FireArtwork } from "./FireArtwork.jsx";
import { TemperatureRail } from "./TemperatureRail.jsx";

export function FireplaceScreen({ intensity, fireSettings, isFireOff, shutdownCountdown, temperature }) {
  return (
    <section className="fire-panel" aria-label="Fireplace control">
      <FireArtwork intensity={intensity} settings={fireSettings} isHidden={isFireOff} />
      <div className="top-vignette" />
      <TemperatureRail temperature={temperature} shutdownCountdown={shutdownCountdown} />
    </section>
  );
}
