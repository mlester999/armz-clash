/** Default local development ports for Armz Clash services and apps. */
export const PORTS = {
  web: 3000,
  game: 3001,
  admin: 3002,
  api: 4000,
  workerHealth: 4002,
} as const;

export type AppPortKey = keyof typeof PORTS;
