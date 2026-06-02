import test from "node:test";
import assert from "node:assert/strict";

import { getNextBatteryLevel } from "../src/hooks/useBatteryCharge.js";

test("getNextBatteryLevel increments battery by one", () => {
  assert.equal(getNextBatteryLevel(55, 100), 56);
});

test("getNextBatteryLevel caps battery at max", () => {
  assert.equal(getNextBatteryLevel(99, 100), 100);
  assert.equal(getNextBatteryLevel(100, 100), 100);
});
