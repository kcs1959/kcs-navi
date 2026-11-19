export interface BoothMapCalloutAnchor {
  id: string
  x: number
  y: number
  side?: 'top' | 'bottom'
}

export interface BoothMapCalloutLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  anchorX: number
  anchorY: number
  edgeX: number
  edgeY: number
  side: 'top' | 'bottom'
  row: number
}

/** 地図の上下の余白へカードを分配し、狭い画面では行数を増やす。 */
export function layoutBoothMapCallouts(
  anchors: readonly BoothMapCalloutAnchor[],
  viewport: { width: number; height: number },
): BoothMapCalloutLayout[] {
  const { width, height } = viewport
  if (!anchors.length || !Number.isFinite(width + height) || width <= 0 || height <= 0) return []

  const margin = Math.min(12, width * 0.04, height * 0.04)
  const gap = Math.min(8, width * 0.02, height * 0.02)
  const availableWidth = width - margin * 2
  const minimumWidth = width < 480 ? 88 : 116
  const desiredWidth = width < 480 ? 100 : width < 640 ? 136 : 152
  const columnLimit = width < 480 ? 3 : 6
  const columns = Math.max(
    1,
    Math.min(columnLimit, Math.floor((availableWidth + gap) / (minimumWidth + gap))),
  )
  const normalized = anchors.map((anchor) => ({
    ...anchor,
    x: Number.isFinite(anchor.x) ? anchor.x : width / 2,
    y: Number.isFinite(anchor.y) ? anchor.y : height / 2,
  }))
  const byPosition = (a: BoothMapCalloutAnchor, b: BoothMapCalloutAnchor) =>
    a.x - b.x || a.y - b.y || a.id.localeCompare(b.id)
  const top = normalized.filter((anchor) => anchor.side === 'top')
  const bottom = normalized.filter((anchor) => anchor.side === 'bottom')
  const automatic = normalized
    .filter((anchor) => !anchor.side)
    .sort((a, b) => a.y - b.y || byPosition(a, b))
  const automaticTopCount = Math.max(0, Math.ceil(anchors.length * (2 / 3)) - top.length)
  top.push(...automatic.slice(0, automaticTopCount))
  bottom.push(...automatic.slice(automaticTopCount))
  top.sort(byPosition)
  bottom.sort(byPosition)

  // 行の枚数を均等にすることで、1枚だけ孤立した行を避ける。
  function rowsFor(items: typeof normalized) {
    const rowCount = Math.ceil(items.length / columns)
    const rows: (typeof normalized)[] = []
    let offset = 0
    for (let row = 0; row < rowCount; row++) {
      const count = Math.ceil((items.length - offset) / (rowCount - row))
      rows.push(items.slice(offset, offset + count))
      offset += count
    }
    return rows
  }
  const topRows = rowsFor(top)
  const bottomRows = rowsFor(bottom)
  const totalRows = topRows.length + bottomRows.length
  const widestRow = Math.max(
    ...topRows.map((row) => row.length),
    ...bottomRows.map((row) => row.length),
  )
  const cardWidth = Math.min(desiredWidth, (availableWidth - gap * (widestRow - 1)) / widestRow)
  const cardHeight = Math.min(54, (height - margin * 2 - gap * (totalRows - 1)) / totalRows)
  const bottomStart = height - margin - bottomRows.length * (cardHeight + gap) + gap
  const result: BoothMapCalloutLayout[] = []

  function placeRows(rows: typeof topRows, side: 'top' | 'bottom', start: number) {
    rows.forEach((row, rowIndex) => {
      const cellWidth = availableWidth / row.length
      row.forEach((anchor, index) => {
        const x = margin + cellWidth * (index + 0.5) - cardWidth / 2
        const y = start + rowIndex * (cardHeight + gap)
        const edgeInset = Math.min(12, cardWidth / 4)
        result.push({
          id: anchor.id,
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          anchorX: anchor.x,
          anchorY: anchor.y,
          edgeX: Math.max(x + edgeInset, Math.min(x + cardWidth - edgeInset, anchor.x)),
          edgeY: side === 'top' ? y + cardHeight : y,
          side,
          row: rowIndex,
        })
      })
    })
  }
  placeRows(topRows, 'top', margin)
  placeRows(bottomRows, 'bottom', bottomStart)
  return result
}
