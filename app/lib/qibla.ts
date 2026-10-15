// Qibla bearing: the initial great-circle bearing from a place to the Kaaba, in degrees clockwise from true north.
// Same formula as the legacy prayer store (`calculateQibla`), as a pure function.
const KAABA = { lat: 21.4225, lon: 39.8262 };
const rad = (d: number) => (d * Math.PI) / 180;

export function qiblaBearing(lat: number, lon: number): number {
  const kLat = rad(KAABA.lat);
  const dLon = rad(KAABA.lon) - rad(lon);
  const la = rad(lat);
  const y = Math.sin(dLon);
  const x = Math.cos(la) * Math.tan(kLat) - Math.sin(la) * Math.cos(dLon);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}
