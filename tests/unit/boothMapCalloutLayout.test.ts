import { describe, expect, it } from 'vitest'
import {
  layoutBoothMapCallouts,
  type BoothMapCalloutAnchor,
} from '../../app/utils/boothMapCalloutLayout'

function anchors(): BoothMapCalloutAnchor[] {
  return Array.from({ length: 9 }, (_, index) => ({
    id: `object-${index}`,
    x: 120 + index * 2,
    y: 180 + index * 2,
    side: index < 6 ? 'top' : 'bottom',
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
})
