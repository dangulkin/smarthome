import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  clampTemperature,
  normalizeTemperature,
  temperatureFromDrag,
  temperatureScale
} from "../src/temperature.js";

test("clampTemperature keeps values inside the fireplace range", () => {
  assert.equal(clampTemperature(12), MIN_TEMPERATURE);
  assert.equal(clampTemperature(31), MAX_TEMPERATURE);
  assert.equal(clampTemperature(23), 23);
});

test("temperatureFromDrag maps upward swipes to colder values", () => {
  assert.equal(temperatureFromDrag(23, -90), 22);
  assert.equal(temperatureFromDrag(23, 90), 24);
});

test("temperatureFromDrag clamps repeated drags at both ends", () => {
  assert.equal(temperatureFromDrag(MAX_TEMPERATURE, 900), MAX_TEMPERATURE);
  assert.equal(temperatureFromDrag(MIN_TEMPERATURE, -900), MIN_TEMPERATURE);
});

test("normalizeTemperature returns a zero-to-one intensity", () => {
  assert.equal(normalizeTemperature(MIN_TEMPERATURE), 0);
  assert.equal(normalizeTemperature(MAX_TEMPERATURE), 1);
  assert.equal(normalizeTemperature(22.5), 0.5);
});

test("temperatureScale lists labels from hottest to coldest", () => {
  assert.deepEqual(temperatureScale(), [26, 25, 24, 23, 22, 21, 20, 19]);
});
