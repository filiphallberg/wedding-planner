import type { TableShape } from '../state/tableShape';

/**
 * Evenly space seats on an ellipse (oval), starting from the top and going clockwise.
 * Percentages match a 280×200 outer box: horizontal radius 110/280 of width, vertical 75/200 of height.
 *
 * `radiusScale` nudges anchors outward so adjacent guest chips have more arc separation
 * (reduces overlap vs. keeping seats on the geometric ellipse).
 */
export function seatPositionOnEllipse(
  index: number,
  count: number,
  radiusScale = 1.08,
): { left: string; top: string } {
  if (count <= 0) return { left: '50%', top: '50%' };
  const θ = -Math.PI / 2 + (2 * Math.PI * index) / count;
  const rxPct = (110 / 280) * 100 * radiusScale;
  const ryPct = (75 / 200) * 100 * radiusScale;
  return {
    left: `${50 + rxPct * Math.cos(θ)}%`,
    top: `${50 + ryPct * Math.sin(θ)}%`,
  };
}

const RX_PCT = (110 / 280) * 100 * 1.08;
const RY_PCT = (75 / 200) * 100 * 1.08;

function seatPositionOnCircle(
  index: number,
  count: number,
  rPct: number,
): { left: string; top: string } {
  if (count <= 0) return { left: '50%', top: '50%' };
  const θ = -Math.PI / 2 + (2 * Math.PI * index) / count;
  return {
    left: `${50 + rPct * Math.cos(θ)}%`,
    top: `${50 + rPct * Math.sin(θ)}%`,
  };
}

/** Distance along rectangle perimeter from top-center, clockwise; returns offset from center in %. */
function pointOnRectanglePerimeter(
  t: number,
  halfW: number,
  halfH: number,
): { ox: number; oy: number } {
  const W = 2 * halfW;
  const H = 2 * halfH;
  const P = 2 * W + 2 * H;
  let d = t * P;
  type Seg = { x0: number; y0: number; dx: number; dy: number; len: number };
  const segments: Seg[] = [
    { x0: 0, y0: -halfH, dx: 1, dy: 0, len: halfW },
    { x0: halfW, y0: -halfH, dx: 0, dy: 1, len: H },
    { x0: halfW, y0: halfH, dx: -1, dy: 0, len: W },
    { x0: -halfW, y0: halfH, dx: 0, dy: -1, len: H },
    { x0: -halfW, y0: -halfH, dx: 1, dy: 0, len: halfW },
  ];
  for (const seg of segments) {
    if (d <= seg.len) {
      const ox = seg.x0 + seg.dx * d;
      const oy = seg.y0 + seg.dy * d;
      return { ox, oy };
    }
    d -= seg.len;
  }
  return { ox: 0, oy: -halfH };
}

function seatPositionOnRectanglePerimeter(
  index: number,
  count: number,
  halfW: number,
  halfH: number,
): { left: string; top: string } {
  if (count <= 0) return { left: '50%', top: '50%' };
  const { ox, oy } = pointOnRectanglePerimeter(index / count, halfW, halfH);
  return {
    left: `${50 + ox}%`,
    top: `${50 + oy}%`,
  };
}

/**
 * Place seats along the perimeter of a rectangle with an arbitrary aspect ratio.
 * Distance is measured in normalized box units (halfW = aspectRatio, halfH = 1) so seats
 * are spaced proportionally to actual edge length: a long rectangle puts most seats on the
 * long edges. Anchors are emitted as percentages of the container's own width/height,
 * inset by `insetXPct` / `insetYPct` from the box center.
 */
function seatPositionOnAspectPerimeter(
  index: number,
  count: number,
  aspectRatio: number,
  insetXPct: number,
  insetYPct: number,
): { left: string; top: string } {
  if (count <= 0) return { left: '50%', top: '50%' };
  const halfW = Math.max(aspectRatio, 0.0001);
  const halfH = 1;
  const W = 2 * halfW;
  const H = 2 * halfH;
  const P = 2 * W + 2 * H;
  let d = (index / count) * P;
  type Seg = { x0: number; y0: number; dx: number; dy: number; len: number };
  const segments: Seg[] = [
    { x0: 0, y0: -halfH, dx: 1, dy: 0, len: halfW },
    { x0: halfW, y0: -halfH, dx: 0, dy: 1, len: H },
    { x0: halfW, y0: halfH, dx: -1, dy: 0, len: W },
    { x0: -halfW, y0: halfH, dx: 0, dy: -1, len: H },
    { x0: -halfW, y0: -halfH, dx: 1, dy: 0, len: halfW },
  ];
  let ox = 0;
  let oy = -halfH;
  for (const seg of segments) {
    if (d <= seg.len) {
      ox = seg.x0 + seg.dx * d;
      oy = seg.y0 + seg.dy * d;
      break;
    }
    d -= seg.len;
  }
  const xPct = (ox / halfW) * insetXPct;
  const yPct = (oy / halfH) * insetYPct;
  return {
    left: `${50 + xPct}%`,
    top: `${50 + yPct}%`,
  };
}

/** Seat anchor for drag-and-drop layout: oval / round use elliptical or circular paths; square / rectangle use the perimeter. */
export function seatPositionForShape(
  index: number,
  count: number,
  shape: TableShape,
  aspectRatio?: number,
): { left: string; top: string } {
  switch (shape) {
    case 'oval':
      return seatPositionOnEllipse(index, count);
    case 'round':
      return seatPositionOnCircle(index, count, RX_PCT);
    case 'square':
      return seatPositionOnRectanglePerimeter(index, count, RX_PCT, RX_PCT);
    case 'rectangle':
      return seatPositionOnAspectPerimeter(index, count, aspectRatio ?? 7 / 5, RX_PCT, RY_PCT);
  }
}
