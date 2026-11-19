export interface BoothMapCalloutAnchor {
  id: string
  x: number
  y: number
  side?: 'top' | 'bottom'
  inset?: boolean
  // アンカーからの相対位置 (px)。指定時は自動配置より優先される。
  offset?: { x: number; y: number }
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

/** 外側のカードを確保し、指定されたカードは物体に近い空き位置へ寄せる。 */
export function layoutBoothMapCallouts(
  anchors: readonly BoothMapCalloutAnchor[],
  viewport: { width: number; height: number },
): BoothMapCalloutLayout[] {
  const { width, height } = viewport
  if (!anchors.length || !Number.isFinite(width + height) || width <= 0 || height <= 0) return []

  const margin = Math.min(12, width * 0.04, height * 0.04)
  const gap = Math.min(8, width * 0.02, height * 0.02)
  const availableWidth = width - margin * 2
  const minimumWidth = width < 480 ? 108 : width < 640 ? 148 : 176
  const desiredWidth = width < 480 ? 124 : width < 640 ? 164 : 184
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
  const byDockingOrder = (a: (typeof normalized)[number], b: (typeof normalized)[number]) =>
    Number(Boolean(a.inset)) - Number(Boolean(b.inset)) || byPosition(a, b)
  top.sort(byDockingOrder)
  bottom.sort(byDockingOrder)

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
  const cardHeight = Math.min(52, (height - margin * 2 - gap * (totalRows - 1)) / totalRows)
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

  function connector(card: BoothMapCalloutLayout) {
    const inset = Math.min(12, card.width / 4, card.height / 4)
    const x = Math.max(card.x + inset, Math.min(card.x + card.width - inset, card.anchorX))
    const y = Math.max(card.y + inset, Math.min(card.y + card.height - inset, card.anchorY))
    const edges = [
      { x, y: card.y },
      { x, y: card.y + card.height },
      { x: card.x, y },
      { x: card.x + card.width, y },
    ]
    return edges.reduce((closest, edge) =>
      Math.hypot(edge.x - card.anchorX, edge.y - card.anchorY) <
      Math.hypot(closest.x - card.anchorX, closest.y - card.anchorY)
        ? edge
        : closest,
    )
  }

  function contains(card: BoothMapCalloutLayout, anchor: BoothMapCalloutAnchor, clearance = 0) {
    return (
      anchor.x >= card.x - clearance &&
      anchor.x <= card.x + card.width + clearance &&
      anchor.y >= card.y - clearance &&
      anchor.y <= card.y + card.height + clearance
    )
  }

  function overlaps(card: BoothMapCalloutLayout, other: BoothMapCalloutLayout) {
    return (
      card.x < other.x + other.width + gap &&
      card.x + card.width + gap > other.x &&
      card.y < other.y + other.height + gap &&
      card.y + card.height + gap > other.y
    )
  }

  const insetAnchors = normalized.filter((anchor) => anchor.inset).sort(byPosition)
  // 初期配置を常に有効な候補として残すため、狭幅でも重なりは発生しない。
  // 解放された場所も使って数回寄せ直し、最初のカードだけが有利になるのを抑える。
  for (let pass = 0; pass < 3; pass++) {
    for (const anchor of insetAnchors) {
      const index = result.findIndex((card) => card.id === anchor.id)
      const original = result[index]!
      const others = result.filter((_, candidateIndex) => candidateIndex !== index)
      const clampX = (x: number) => Math.max(margin, Math.min(width - margin - cardWidth, x))
      const clampY = (y: number) => Math.max(margin, Math.min(height - margin - cardHeight, y))
      const xs = new Set<number>([original.x, margin, width - margin - cardWidth])
      const ys = new Set<number>([original.y, margin, height - margin - cardHeight])
      const stemGap = 24
      for (const x of [
        anchor.x - cardWidth / 2,
        anchor.x + stemGap,
        anchor.x - stemGap - cardWidth,
      ]) {
        xs.add(clampX(x))
      }
      for (const y of [
        anchor.y - cardHeight / 2,
        anchor.y + stemGap,
        anchor.y - stemGap - cardHeight,
      ]) {
        ys.add(clampY(y))
      }
      for (const other of others) {
        for (const x of [other.x, other.x + other.width + gap, other.x - gap - cardWidth])
          xs.add(clampX(x))
        for (const y of [other.y, other.y + other.height + gap, other.y - gap - cardHeight])
          ys.add(clampY(y))
      }
      for (let x = margin; x <= width - margin - cardWidth; x += cardWidth + gap) xs.add(x)
      for (let y = margin; y <= height - margin - cardHeight; y += cardHeight + gap) ys.add(y)

      function score(card: BoothMapCalloutLayout) {
        const edge = connector(card)
        const length = Math.hypot(edge.x - anchor.x, edge.y - anchor.y)
        const covered = normalized.filter(
          (other) => other.id !== anchor.id && contains(card, other, 5),
        ).length
        const wrongSide =
          anchor.side === 'top' ? card.y > anchor.y : card.y + card.height < anchor.y
        const centerDistance = Math.hypot(
          card.x + card.width / 2 - width / 2,
          card.y + card.height / 2 - height / 2,
        )
        return length ** 2 + covered * 6400 + (wrongSide ? 400 : 0) + centerDistance * 0.05
      }
      let best = original
      let bestScore = contains(original, anchor, 6) ? Number.POSITIVE_INFINITY : score(original)
      for (const x of [...xs].sort((a, b) => a - b)) {
        for (const y of [...ys].sort((a, b) => a - b)) {
          const candidate = { ...original, x, y }
          if (contains(candidate, anchor, 6) || others.some((other) => overlaps(candidate, other)))
            continue
          const candidateScore = score(candidate)
          if (candidateScore < bestScore - 0.01) {
            best = candidate
            bestScore = candidateScore
          }
        }
      }
      const edge = connector(best)
      result[index] = { ...best, edgeX: edge.x, edgeY: edge.y }
    }
  }
  // コードで指定したオフセットを、自動配置結果に上書きする。
  for (const anchor of normalized) {
    if (!anchor.offset) continue
    const index = result.findIndex((card) => card.id === anchor.id)
    if (index < 0) continue
    const card = result[index]!
    const x = Math.max(margin, Math.min(width - margin - card.width, anchor.x + anchor.offset.x))
    const y = Math.max(margin, Math.min(height - margin - card.height, anchor.y + anchor.offset.y))
    const updated = { ...card, x, y }
    const edge = connector(updated)
    result[index] = { ...updated, edgeX: edge.x, edgeY: edge.y }
  }
  return result
}
