export const BASE_URL = import.meta.env?.BASE_URL ?? "/smarthome/";

export const DEFAULT_PREVIEW_SCALE = 0.7;
export const DEVICE_SCREEN_TRANSITION_MS = 520;
export const NAVIGATION_RENDER_RADIUS = 8;

export const DEFAULT_VIEW_SETTINGS = {
  showDevice: true,
  showStatusBar: true,
  showHomeBar: true,
  pageBackground: "#141416"
};

export const DEVICE_SCREEN_TYPES = {
  FIREPLACE: "fireplace",
  CHARGEABLE: "chargeable",
  PLACEHOLDER: "placeholder"
};

export const DEVICES = [
  {
    id: "humidifier",
    label: "Humidifier",
    screenType: DEVICE_SCREEN_TYPES.PLACEHOLDER
  },
  {
    id: "lamp",
    label: "Lamp",
    screenType: DEVICE_SCREEN_TYPES.PLACEHOLDER
  },
  {
    id: "fireplace",
    label: "Fireplace",
    screenType: DEVICE_SCREEN_TYPES.FIREPLACE
  },
  {
    id: "gamepad",
    label: "Gamepad",
    screenType: DEVICE_SCREEN_TYPES.CHARGEABLE,
    asset: `${BASE_URL}images/gamepad.png`,
    ariaLabel: "Gamepad control",
    battery: {
      initial: 55,
      max: 100,
      firstDelayMs: 5000,
      intervalMs: 30000
    },
    copy: [
      ["You've played ", { badge: "33 HRS" }, " this week."],
      [{ badge: "BLOCK THE GAMEPAD" }, " for 24 hrs."],
      ["Better ", { badge: "READ A BOOK" }]
    ]
  },
  {
    id: "headphones",
    label: "Headphones",
    screenType: DEVICE_SCREEN_TYPES.CHARGEABLE,
    asset: `${BASE_URL}images/headphones@2x.png`,
    ariaLabel: "Headphones control",
    deviceClassName: "headphones-device",
    deviceWrapClassName: "headphones-device-wrap",
    copyClassName: "headphones-copy",
    reflection: true,
    battery: {
      initial: 85,
      max: 100,
      firstDelayMs: 5000,
      intervalMs: 30000
    },
    copy: [
      ["You've listened ", { badge: "12 HRS" }, " this week."],
      [{ badge: "PAPOOZ" }, " is your favourite band."],
      ["Most listened track is ", { badge: "IT HURTS ME" }]
    ]
  },
  {
    id: "vacuum",
    label: "Vacuum",
    screenType: DEVICE_SCREEN_TYPES.PLACEHOLDER
  }
];

export const INITIAL_DEVICE_INDEX = DEVICES.findIndex((device) => device.id === "fireplace");

export const CHARGEABLE_DEVICE_IDS = DEVICES.filter((device) => device.screenType === DEVICE_SCREEN_TYPES.CHARGEABLE).map((device) => device.id);

export const GAMEPAD_DUST = {
  far: [
    [10, 18, 0],
    [28, 42, 1.8],
    [49, 22, 3.2],
    [68, 48, 0.9],
    [88, 30, 2.7]
  ],
  mid: [
    [16, 34, 0.6],
    [34, 16, 2.4],
    [54, 46, 1.1],
    [73, 22, 3.5],
    [91, 42, 1.9]
  ],
  near: [
    [22, 50, 1.3],
    [42, 28, 3.1],
    [63, 54, 0.4],
    [82, 18, 2.2]
  ]
};

export function getDeviceByIndex(index) {
  return DEVICES[((index % DEVICES.length) + DEVICES.length) % DEVICES.length];
}

export function getDeviceById(id) {
  return DEVICES.find((device) => device.id === id);
}

export function buildVisibleScreens(screenTransition) {
  if (screenTransition.previousIndex === null) {
    return [{ index: screenTransition.currentIndex, device: getDeviceByIndex(screenTransition.currentIndex), phase: "active" }];
  }

  if (screenTransition.direction === "backward") {
    return [
      { index: screenTransition.currentIndex, device: getDeviceByIndex(screenTransition.currentIndex), phase: "entering" },
      { index: screenTransition.previousIndex, device: getDeviceByIndex(screenTransition.previousIndex), phase: "exiting" }
    ];
  }

  return [
    { index: screenTransition.previousIndex, device: getDeviceByIndex(screenTransition.previousIndex), phase: "exiting" },
    { index: screenTransition.currentIndex, device: getDeviceByIndex(screenTransition.currentIndex), phase: "entering" }
  ];
}
