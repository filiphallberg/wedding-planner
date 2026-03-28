import type { WeddingState } from '../state/types'

/** Download full app state as a JSON file. */
export function downloadConfigJson(state: WeddingState): void {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wedding-seating-config-${new Date().toISOString().slice(0, 10)}.json`
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}
