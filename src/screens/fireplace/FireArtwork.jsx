import { useEffect, useRef } from "react";

import { COLD_FLAME_LOOP_SECONDS, HOT_FLAME_LOOP_SECONDS } from "../../config/fire.js";

export function FireArtwork({ intensity, settings, isHidden }) {
  const redPathRef = useRef(null);
  const orangePathRef = useRef(null);
  const goldPathRef = useRef(null);
  const coreRef = useRef(null);
  const intensityRef = useRef(intensity);
  const settingsRef = useRef(settings);
  const shouldAnimateFire = !isHidden && (settings.showRed || settings.showOrange || settings.showGold || settings.showCore);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!shouldAnimateFire) {
      return undefined;
    }

    let animationFrame = 0;
    let previousTimeMs = null;
    let phase = 0;
    let horizontalPhase = 0;
    let smoothHeat = intensityRef.current;

    const redBase = [-8, 250, 78, 430, 14, 80, 166, 420, 89, -34, 262, 340, 254, 96, 344, 404, 390, -20];
    const orangeBase = [55, 330, 130, 498, 88, 105, 205, 430, 195, 210, 296, 506, 326, 138];
    const goldBase = [70, 454, 124, 566, 164, 382, 192, 530, 216, 248, 258, 512, 302, 398, 340, 520, 366, 332];

    const point = (base, index, amount, verticalTime, horizontalTime, phaseOffset, motion, currentSettings) => {
      const verticalAmount = amount * motion * currentSettings.verticalAmplitude;
      const horizontalAmount = amount * motion * 0.22 * currentSettings.horizontalAmplitude;
      const x = base[index] + Math.sin(horizontalTime * 1.1 + phaseOffset) * horizontalAmount;
      const y = base[index + 1] + Math.sin(verticalTime + phaseOffset) * verticalAmount;
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

      if (currentSettings.showRed) {
        redPathRef.current?.setAttribute(
          "d",
          `M-18 648 L${point(redBase, 0, 32, verticalTime, horizontalTime, 0.2, motion, currentSettings)} L${point(redBase, 2, -18, verticalTime, horizontalTime, 1.1, motion, currentSettings)} L${point(redBase, 4, 44, verticalTime, horizontalTime, 2.2, motion, currentSettings)} L${point(redBase, 6, -28, verticalTime, horizontalTime, 3.1, motion, currentSettings)} L${point(redBase, 8, 40, verticalTime, horizontalTime, 4.0, motion, currentSettings)} L${point(redBase, 10, -22, verticalTime, horizontalTime, 4.7, motion, currentSettings)} L${point(redBase, 12, 30, verticalTime, horizontalTime, 5.4, motion, currentSettings)} L${point(redBase, 14, -34, verticalTime, horizontalTime, 6.1, motion, currentSettings)} L${point(redBase, 16, 38, verticalTime, horizontalTime, 6.8, motion, currentSettings)} L426 648 Z`
        );
      }

      if (currentSettings.showOrange) {
        orangePathRef.current?.setAttribute(
          "d",
          `M42 664 L${point(orangeBase, 0, -28, verticalTime, horizontalTime, 0.9, motion, currentSettings)} L${point(orangeBase, 2, 24, verticalTime, horizontalTime, 1.7, motion, currentSettings)} L${point(orangeBase, 4, 38, verticalTime, horizontalTime, 2.6, motion, currentSettings)} L${point(orangeBase, 6, -30, verticalTime, horizontalTime, 3.6, motion, currentSettings)} L${point(orangeBase, 8, 36, verticalTime, horizontalTime, 4.4, motion, currentSettings)} L${point(orangeBase, 10, -24, verticalTime, horizontalTime, 5.2, motion, currentSettings)} L${point(orangeBase, 12, 34, verticalTime, horizontalTime, 6.0, motion, currentSettings)} L410 664 Z`
        );
      }

      if (currentSettings.showGold) {
        goldPathRef.current?.setAttribute(
          "d",
          `M22 670 L${point(goldBase, 0, -28, verticalTime, horizontalTime, 1.3, motion, currentSettings)} L${point(goldBase, 2, 18, verticalTime, horizontalTime, 1.8, motion, currentSettings)} L${point(goldBase, 4, -30, verticalTime, horizontalTime, 2.3, motion, currentSettings)} L${point(goldBase, 6, 22, verticalTime, horizontalTime, 3.0, motion, currentSettings)} L${point(goldBase, 8, 44, verticalTime, horizontalTime, 3.6, motion, currentSettings)} L${point(goldBase, 10, -26, verticalTime, horizontalTime, 4.2, motion, currentSettings)} L${point(goldBase, 12, -22, verticalTime, horizontalTime, 4.9, motion, currentSettings)} L${point(goldBase, 14, 24, verticalTime, horizontalTime, 5.5, motion, currentSettings)} L${point(goldBase, 16, -28, verticalTime, horizontalTime, 6.1, motion, currentSettings)} L348 670 Z`
        );
      }

      const corePulse = Math.sin(verticalTime + 1.3);
      const coreDrift = Math.sin(horizontalTime * 1.1 + 2.1);
      if (currentSettings.showCore && coreRef.current) {
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
  }, [shouldAnimateFire]);

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
