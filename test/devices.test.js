import test from "node:test";
import assert from "node:assert/strict";

import { DEVICES, buildVisibleScreens, getDeviceByIndex } from "../src/config/devices.js";

test("getDeviceByIndex wraps positive and negative indexes", () => {
  assert.equal(getDeviceByIndex(0).label, "Humidifier");
  assert.equal(getDeviceByIndex(DEVICES.length).label, "Humidifier");
  assert.equal(getDeviceByIndex(-1).label, "Vacuum");
  assert.equal(getDeviceByIndex(-DEVICES.length - 1).label, "Vacuum");
});

test("buildVisibleScreens returns one active screen outside transitions", () => {
  assert.deepEqual(
    buildVisibleScreens({
      currentIndex: 2,
      previousIndex: null,
      direction: "forward"
    }).map(({ device, phase }) => [device.label, phase]),
    [["Fireplace", "active"]]
  );
});

test("buildVisibleScreens orders forward transitions as previous then current", () => {
  assert.deepEqual(
    buildVisibleScreens({
      currentIndex: 3,
      previousIndex: 2,
      direction: "forward"
    }).map(({ device, phase }) => [device.label, phase]),
    [
      ["Fireplace", "exiting"],
      ["Gamepad", "entering"]
    ]
  );
});

test("buildVisibleScreens orders backward transitions as current then previous", () => {
  assert.deepEqual(
    buildVisibleScreens({
      currentIndex: 2,
      previousIndex: 3,
      direction: "backward"
    }).map(({ device, phase }) => [device.label, phase]),
    [
      ["Fireplace", "entering"],
      ["Gamepad", "exiting"]
    ]
  );
});
