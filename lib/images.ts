// Image resolver for Open Road Trivia
// City images: chicago-il.jpg, st-louis-mo.jpg
// Region images: chicagoland.jpg, illinois-prairie.jpg
// Stop images: art-institute-of-chicago.jpg

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EXT = '.jpg';

export function getCityImage(cityName: string, state?: string): string {
  const slug = toSlug(cityName);
  const stateSlug = state ? `-${state.toLowerCase()}` : '';
  return `/images/cities/${slug}${stateSlug}${EXT}`;
}

export function getRegionImage(regionName: string): string {
  return `/images/regions/${toSlug(regionName)}${EXT}`;
}

export function getStopImage(stopName: string): string {
  return `/images/stops/${toSlug(stopName)}${EXT}`;
}

export function getResultImage(stopName?: string, cityName?: string): string | undefined {
  if (stopName) return getStopImage(stopName);
  if (cityName) return getCityImage(cityName);
  return undefined;
}
