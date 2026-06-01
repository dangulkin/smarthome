export const MIN_TEMPERATURE = 17;
export const MAX_TEMPERATURE = 26;
export const OFF_TEMPERATURE = MIN_TEMPERATURE - 1;
export const TEMPERATURE_STEP = 1;

export function clampTemperature(value) {
  return Math.min(MAX_TEMPERATURE, Math.max(OFF_TEMPERATURE, value));
}

export function normalizeTemperature(value) {
  const clampedValue = clampTemperature(value);
  if (clampedValue <= OFF_TEMPERATURE) {
    return 0;
  }

  return (clampedValue - MIN_TEMPERATURE) / (MAX_TEMPERATURE - MIN_TEMPERATURE);
}

export function temperatureFromDrag(startTemperature, translationY, pixelsPerDegree = 84) {
  const raw = startTemperature + translationY / pixelsPerDegree;
  return clampTemperature(Math.round(raw / TEMPERATURE_STEP) * TEMPERATURE_STEP);
}

export function temperatureScale() {
  const values = [];

  for (let value = MAX_TEMPERATURE; value >= MIN_TEMPERATURE; value -= TEMPERATURE_STEP) {
    values.push(value);
  }

  values.push(OFF_TEMPERATURE);

  return values;
}
