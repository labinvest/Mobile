// Enquadra um trajeto no mapa: projeção Web Mercator, zoom e blocos (tiles) do OpenStreetMap.

export const TILE_SIZE = 256;

type LatLng = { latitude: number; longitude: number };

function project({ latitude, longitude }: LatLng, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((latitude * Math.PI) / 180);
  return { x: ((longitude + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}

/** Maior zoom em que o trajeto cabe na área, as posições dos pontos na tela e os blocos que cobrem a área. */
export function fitRoute(points: LatLng[], width: number, height: number, padding = 32, maxZoom = 17) {
  let zoom = maxZoom;
  let pixels = points.map((point) => project(point, zoom));
  const bounds = () => {
    const xs = pixels.map((pixel) => pixel.x);
    const ys = pixels.map((pixel) => pixel.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  };
  let box = bounds();
  while (zoom > 1 && (box.maxX - box.minX > width - 2 * padding || box.maxY - box.minY > height - 2 * padding)) {
    zoom -= 1;
    pixels = points.map((point) => project(point, zoom));
    box = bounds();
  }

  const left = (box.minX + box.maxX) / 2 - width / 2;
  const top = (box.minY + box.maxY) / 2 - height / 2;
  const count = 2 ** zoom;
  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let x = Math.floor(left / TILE_SIZE); x <= Math.floor((left + width) / TILE_SIZE); x++) {
    for (let y = Math.max(0, Math.floor(top / TILE_SIZE)); y <= Math.min(count - 1, Math.floor((top + height) / TILE_SIZE)); y++) {
      tiles.push({ key: `${zoom}/${x}/${y}`, url: `https://tile.openstreetmap.org/${zoom}/${((x % count) + count) % count}/${y}.png`, left: x * TILE_SIZE - left, top: y * TILE_SIZE - top });
    }
  }
  return { line: pixels.map((pixel) => ({ x: pixel.x - left, y: pixel.y - top })), tiles };
}
