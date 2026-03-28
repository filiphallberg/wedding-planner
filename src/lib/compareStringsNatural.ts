/** Sort so digit runs compare numerically (e.g. "Table 2" before "Table 10"). */
export function compareStringsNatural(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}
