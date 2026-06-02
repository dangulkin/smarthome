import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { NAVIGATION_RENDER_RADIUS, getDeviceByIndex } from "../config/devices.js";

export function DeviceSelector({ activeDeviceIndex }) {
  const selectorRef = useRef(null);
  const trackRef = useRef(null);
  const [trackOffset, setTrackOffset] = useState(0);
  const visibleDevices = useMemo(
    () =>
      Array.from({ length: NAVIGATION_RENDER_RADIUS * 2 + 1 }, (_, index) => {
        const deviceIndex = activeDeviceIndex - NAVIGATION_RENDER_RADIUS + index;
        return {
          device: getDeviceByIndex(deviceIndex),
          index: deviceIndex
        };
      }),
    [activeDeviceIndex]
  );

  useLayoutEffect(() => {
    let animationFrame = null;

    const updateTrackOffset = () => {
      const selector = selectorRef.current;
      const track = trackRef.current;
      const activeItem = track?.querySelector(".device.selected");

      if (!selector || !track || !activeItem) {
        return;
      }

      const activeCenter = activeItem.offsetLeft + activeItem.offsetWidth / 2;
      setTrackOffset(selector.clientWidth / 2 - activeCenter);
    };

    updateTrackOffset();
    animationFrame = window.requestAnimationFrame(updateTrackOffset);
    window.addEventListener("resize", updateTrackOffset);
    document.fonts?.ready?.then(updateTrackOffset);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("resize", updateTrackOffset);
    };
  }, [activeDeviceIndex, visibleDevices]);

  return (
    <nav className="device-selector" aria-label="Device selector" ref={selectorRef}>
      <div className="device-selector-track" ref={trackRef} style={{ "--device-track-offset": `${trackOffset}px` }}>
        {visibleDevices.map(({ device, index }) => {
          const distance = index - activeDeviceIndex;
          const absDistance = Math.abs(distance);
          const className = absDistance === 0 ? "selected" : absDistance === 1 ? "secondary" : absDistance === 2 ? "tertiary" : "muted";
          const distanceClass = absDistance >= 3 ? "far" : "";

          return (
            <span className={`device ${className} ${distanceClass}`} key={index}>
              {device.label}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
