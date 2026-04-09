export const TABLE_SHAPES = ['oval', 'round', 'square', 'rectangle'] as const
export type TableShape = (typeof TABLE_SHAPES)[number]

export function isTableShape(value: unknown): value is TableShape {
  return typeof value === 'string' && (TABLE_SHAPES as readonly string[]).includes(value)
}
