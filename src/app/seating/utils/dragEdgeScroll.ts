const EDGE_PX = 84;
const MAX_STEP_PX = 18;

function speedForEdge(distance: number): number {
  if (distance >= EDGE_PX) return 0;
  const ratio = (EDGE_PX - distance) / EDGE_PX;
  return Math.max(2, Math.round(ratio * MAX_STEP_PX));
}

export function applyDragEdgeScroll(el: HTMLElement, pointer: { x: number; y: number }): void {
  const rect = el.getBoundingClientRect();
  const topDist = Math.max(0, pointer.y - rect.top);
  const bottomDist = Math.max(0, rect.bottom - pointer.y);
  const leftDist = Math.max(0, pointer.x - rect.left);
  const rightDist = Math.max(0, rect.right - pointer.x);

  const up = speedForEdge(topDist);
  const down = speedForEdge(bottomDist);
  const left = speedForEdge(leftDist);
  const right = speedForEdge(rightDist);

  if (up > 0) el.scrollTop -= up;
  if (down > 0) el.scrollTop += down;
  if (left > 0) el.scrollLeft -= left;
  if (right > 0) el.scrollLeft += right;
}
