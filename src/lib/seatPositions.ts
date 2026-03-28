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
  if (count <= 0) return { left: '50%', top: '50%' }
  const θ = -Math.PI / 2 + (2 * Math.PI * index) / count
  const rxPct = (110 / 280) * 100 * radiusScale
  const ryPct = (75 / 200) * 100 * radiusScale
  return {
    left: `${50 + rxPct * Math.cos(θ)}%`,
    top: `${50 + ryPct * Math.sin(θ)}%`,
  }
}
