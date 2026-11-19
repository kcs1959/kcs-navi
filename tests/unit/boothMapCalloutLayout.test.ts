import { describe, expect, it } from 'vitest'
import {
  layoutBoothMapCallouts,
  type BoothMapCalloutAnchor,
} from '../../app/utils/boothMapCalloutLayout'
import { boothMapCalloutOffsets, boothMapLocations } from '../../shared/boothMap'

function anchors(): BoothMapCalloutAnchor[] {
  return Array.from({ length: 9 }, (_, index) => ({
    id: `object-${index}`,
    x: 120 + index * 2,
    y: 180 + index * 2,
    side: index < 6 ? 'top' : 'bottom',
  }))
}

function objectAnchors(width: number): BoothMapCalloutAnchor[] {
  const locations =
    width === 1040
      ? [
          ['board-wall', 269, 251],
          ['desk-a', 409, 280],
          ['desk-b', 516, 320],
          ['desk-c', 622, 359],
          ['desk-d', 729, 398],
          ['desk-e', 836, 437],
          ['desk-f', 201, 380],
          ['board-stand', 502, 435],
          ['smartphone', 652, 494],
        ]
      : width === 310
        ? [
            ['board-wall', 78, 241],
            ['desk-a', 121, 250],
            ['desk-b', 154, 262],
            ['desk-c', 186, 274],
            ['desk-d', 219, 286],
            ['desk-e', 252, 298],
            ['desk-f', 58, 280],
            ['board-stand', 149, 297],
            ['smartphone', 195, 315],
          ]
        : [
            ['board-wall', 66, 248],
            ['desk-a', 100, 255],
            ['desk-b', 127, 265],
            ['desk-c', 153, 274],
            ['desk-d', 180, 284],
            ['desk-e', 206, 294],
            ['desk-f', 49, 280],
            ['board-stand', 124, 293],
            ['smartphone', 161, 308],
          ]
  return locations.map(([id, x, y]) => ({
    id: String(id),
    x: Number(x),
    y: Number(y),
    side: ['desk-f', 'board-stand', 'smartphone'].includes(String(id)) ? 'bottom' : 'top',
    inset: !['desk-a', 'desk-b', 'desk-c'].includes(String(id)),
  }))
}

describe('booth map callout layout', () => {
  it.each([
    { width: 240, height: 380 },
    { width: 310, height: 380 },
    { width: 320, height: 380 },
    { width: 480, height: 480 },
    { width: 1040, height: 640 },
  ])('keeps nine clustered callouts inside $width × $height without overlap', (viewport) => {
    const cards = layoutBoothMapCallouts(anchors(), viewport)
    expect(cards).toHaveLength(9)
    for (const card of cards) {
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.y).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(viewport.width)
      expect(card.y + card.height).toBeLessThanOrEqual(viewport.height)
      expect(card.height).toBeGreaterThanOrEqual(44)
      expect(card.width).toBeGreaterThanOrEqual(88)
      expect(card.edgeX).toBeGreaterThan(card.x)
      expect(card.edgeX).toBeLessThan(card.x + card.width)
      expect([card.y, card.y + card.height]).toContain(card.edgeY)
    }
    cards.forEach((card, index) => {
      for (const other of cards.slice(index + 1)) {
        const overlaps =
          card.x < other.x + other.width &&
          card.x + card.width > other.x &&
          card.y < other.y + other.height &&
          card.y + card.height > other.y
        expect(overlaps, `${card.id} overlaps ${other.id}`).toBe(false)
      }
    })
  })

  it('honors explicit sides even when the lower group projects above the upper group', () => {
    const input = anchors().map((anchor) => ({ ...anchor, y: anchor.side === 'top' ? 300 : 100 }))
    const cards = layoutBoothMapCallouts(input, { width: 320, height: 380 })
    expect(cards.filter((card) => card.side === 'top').map((card) => card.id)).toEqual(
      input.filter((anchor) => anchor.side === 'top').map((anchor) => anchor.id),
    )
    expect(cards.filter((card) => card.side === 'bottom')).toHaveLength(3)
  })

  it('uses the upper six anchors when side is not specified', () => {
    const input = anchors().map(({ id, x, y }) => ({ id, x, y }))
    const cards = layoutBoothMapCallouts(input, { width: 320, height: 380 })
    expect(cards.filter((card) => card.side === 'top').map((card) => card.id)).toEqual(
      input.slice(0, 6).map((anchor) => anchor.id),
    )
  })

  it('is stable across incoming order and does not mutate anchor data', () => {
    const input = anchors().map((anchor) => ({ ...anchor, x: 120, y: 180 }))
    const original = structuredClone(input)
    const forward = layoutBoothMapCallouts(input, { width: 320, height: 380 })
    const reversed = layoutBoothMapCallouts([...input].reverse(), { width: 320, height: 380 })
    expect(reversed).toEqual(forward)
    expect(input).toEqual(original)
  })

  it('keeps true off-screen anchors while attaching their lines to cards inside the viewport', () => {
    const cards = layoutBoothMapCallouts(
      [
        { id: 'left', x: -100, y: -100 },
        { id: 'right', x: 10000, y: 10000 },
      ],
      { width: 320, height: 380 },
    )
    expect(cards.find((card) => card.id === 'left')).toMatchObject({ anchorX: -100, anchorY: -100 })
    expect(cards.find((card) => card.id === 'right')).toMatchObject({
      anchorX: 10000,
      anchorY: 10000,
    })
    for (const card of cards) {
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(320)
      expect(Number.isFinite(card.edgeX + card.edgeY)).toBe(true)
    }
  })

  it('waits for a measurable viewport and handles an empty anchor list', () => {
    expect(layoutBoothMapCallouts([], { width: 320, height: 380 })).toEqual([])
    expect(layoutBoothMapCallouts(anchors(), { width: 0, height: 380 })).toEqual([])
    expect(layoutBoothMapCallouts(anchors(), { width: 320, height: 0 })).toEqual([])
  })

  it.each([
    { width: 256, height: 500, previous: [1000, 1000, 1000, 1000, 1000, 1000] },
    { width: 310, height: 500, previous: [1000, 1000, 1000, 1000, 1000, 1000] },
    { width: 1040, height: 760, previous: [1000, 1000, 1000, 1000, 1000, 1000] },
  ])('brings all six requested cards closer at $width px while enlarging them', (viewport) => {
    const input = objectAnchors(viewport.width)
    const cards = layoutBoothMapCallouts(input, viewport)
    const ids = ['board-wall', 'desk-d', 'desk-e', 'desk-f', 'board-stand', 'smartphone']
    for (const [index, id] of ids.entries()) {
      const card = cards.find((item) => item.id === id)!
      expect(Math.hypot(card.edgeX - card.anchorX, card.edgeY - card.anchorY)).toBeLessThan(
        viewport.previous[index]!,
      )
      const coversOwnAnchor =
        card.anchorX >= card.x &&
        card.anchorX <= card.x + card.width &&
        card.anchorY >= card.y &&
        card.anchorY <= card.y + card.height
      expect(coversOwnAnchor).toBe(false)
    }
    for (const card of cards) {
      expect(card.width).toBeGreaterThan(100)
      expect(card.height).toBe(52)
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.y).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(viewport.width)
      expect(card.y + card.height).toBeLessThanOrEqual(viewport.height)
      for (const other of cards.filter((item) => item.id !== card.id)) {
        expect(
          card.x < other.x + other.width &&
            card.x + card.width > other.x &&
            card.y < other.y + other.height &&
            card.y + card.height > other.y,
        ).toBe(false)
      }
    }
    expect(layoutBoothMapCallouts([...input].reverse(), viewport)).toEqual(cards)
  })

  it('lays out only the outer top cards for independent camera padding measurement', () => {
    const input = objectAnchors(310).filter((anchor) => !anchor.inset)
    const cards = layoutBoothMapCallouts(input, { width: 310, height: 500 })
    expect(cards).toHaveLength(3)
    expect(cards.every((card) => card.side === 'top' && card.y + card.height < 180)).toBe(true)
  })
})

describe('booth map callout offsets on phones', () => {
  // 実機相当のブラウザで計測したアンカー座標（地図の高さは500px）。
  const measured = {
    280: {
      'desk-a': [110, 258],
      'desk-b': [139, 269],
      'desk-c': [168, 280],
      'board-wall': [71, 250],
      'desk-d': [197, 290],
      'desk-e': [226, 301],
      'desk-f': [53, 285],
      'board-stand': [135, 301],
      smartphone: [176, 316],
    },
    310: {
      'desk-a': [121, 256],
      'desk-b': [154, 268],
      'desk-c': [186, 280],
      'board-wall': [78, 247],
      'desk-d': [219, 292],
      'desk-e': [252, 304],
      'desk-f': [58, 286],
      'board-stand': [149, 303],
      smartphone: [195, 321],
    },
    350: {
      'desk-a': [136, 252],
      'desk-b': [173, 265],
      'desk-c': [211, 279],
      'board-wall': [87, 242],
      'desk-d': [248, 293],
      'desk-e': [286, 306],
      'desk-f': [64, 287],
      'board-stand': [169, 306],
      smartphone: [221, 326],
    },
  } as const

  it.each(Object.keys(measured).map(Number))('keeps all nine cards apart at %i px', (width) => {
    const input = boothMapLocations.map((location) => {
      const [x, y] = measured[width as keyof typeof measured][location.deskId]
      return {
        id: location.deskId,
        side: location.side,
        inset: location.inset,
        x,
        y,
        offset: boothMapCalloutOffsets[location.deskId],
      }
    })
    const cards = layoutBoothMapCallouts(input, { width, height: 500 })
    expect(cards).toHaveLength(9)
    cards.forEach((card, index) => {
      expect(card.x).toBeGreaterThanOrEqual(0)
      expect(card.x + card.width).toBeLessThanOrEqual(width)
      for (const other of cards.slice(index + 1)) {
        const overlaps =
          card.x < other.x + other.width &&
          card.x + card.width > other.x &&
          card.y < other.y + other.height &&
          card.y + card.height > other.y
        expect(overlaps, `${card.id} overlaps ${other.id}`).toBe(false)
      }
      for (const anchor of input.filter((item) => item.id !== card.id)) {
        const covers =
          anchor.x >= card.x &&
          anchor.x <= card.x + card.width &&
          anchor.y >= card.y &&
          anchor.y <= card.y + card.height
        expect(covers, `${card.id} covers ${anchor.id}`).toBe(false)
      }
    })
  })
})
