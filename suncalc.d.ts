declare module 'suncalc' {
  // This build returns degrees: altitude (0 = horizon, 90 = zenith) and
  // azimuth (degrees clockwise from north).
  interface SunPosition { altitude: number, azimuth: number }
  export function getPosition(date: Date, latitude: number, longitude: number): SunPosition
  const SunCalc: { getPosition: typeof getPosition }
  export default SunCalc
}
