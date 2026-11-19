import { useRef, useState, type PointerEvent } from 'react'

export function useSortableRows(onMove: (source: string, target: string) => void) {
  const pointer = useRef<number | null>(null)
  const [drag, setDrag] = useState<{ source: string; target: string } | null>(null)

  function handle(id: string) {
    function targetAt(event: PointerEvent<HTMLSpanElement>) {
      const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-sort-row]')
      const list = event.currentTarget.closest('[data-sort-list]')
      return row && list?.contains(row) ? row.dataset.sortRow : undefined
    }

    return {
      onPointerDown(event: PointerEvent<HTMLSpanElement>) {
        if (event.button !== 0 || pointer.current !== null) return
        event.currentTarget.setPointerCapture(event.pointerId)
        pointer.current = event.pointerId
        setDrag({ source: id, target: id })
      },
      onPointerMove(event: PointerEvent<HTMLSpanElement>) {
        if (pointer.current !== event.pointerId) return
        setDrag({ source: id, target: targetAt(event) ?? id })
      },
      onPointerUp(event: PointerEvent<HTMLSpanElement>) {
        if (pointer.current !== event.pointerId) return
        const target = targetAt(event)
        pointer.current = null
        setDrag(null)
        if (target && target !== id) onMove(id, target)
      },
      onLostPointerCapture(event: PointerEvent<HTMLSpanElement>) {
        if (pointer.current !== event.pointerId) return
        pointer.current = null
        setDrag(null)
      },
    }
  }

  return { handle, isTarget: (id: string) => drag?.target === id && drag.source !== id }
}

export function reorder<T extends string>(order: readonly T[], source: string, target: string): T[] {
  const from = order.findIndex(id => id === source)
  const to = order.findIndex(id => id === target)
  if (from < 0 || to < 0 || from === to) return [...order]
  const next = [...order]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
