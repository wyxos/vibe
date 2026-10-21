import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAutoScrollState, VibeAutoScrollController } from '@/core/autoScroll'

const frames = new Map<number, FrameRequestCallback>()
let frameId = 0
const controllers: VibeAutoScrollController[] = []

function tick(time: number) {
  const pending = [...frames.values()]
  frames.clear()
  expect(pending).toHaveLength(1)
  pending[0]!(time)
}

function scroller(quantize: (value: number) => number = Math.round, initial = 0, limit = 10_000) {
  let position = initial, maximum = limit, getterCalls = 0
  const writes: number[] = []
  const element = {
    clientHeight: 100,
    get scrollHeight() { return maximum + 100 },
    get scrollTop() { getterCalls++; position = Math.min(maximum, position); return position },
    set scrollTop(value: number) { writes.push(value); position = Math.min(maximum, Math.max(0, quantize(value))) },
  } as HTMLElement
  return { element, writes, position: () => position, reads: () => getterCalls,
    external(value: number) { position = Math.min(maximum, Math.max(0, value)) },
    limit(value: number) { maximum = value } }
}

function fixture(speed = 20, target = scroller()) {
  let owner: HTMLElement | null = target.element
  const state = createAutoScrollState({ minSpeedPxPerSecond: 20, maxSpeedPxPerSecond: 640, speedPxPerSecond: speed })
  const controller = new VibeAutoScrollController({ getScrollElement: () => owner, state })
  controllers.push(controller)
  controller.mount(); controller.setEnabled(true)
  return { target, state, controller, owner(value: HTMLElement | null) { owner = value } }
}

beforeEach(() => {
  frames.clear(); frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId; frames.set(id, callback); return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id) })
})
afterEach(() => {
  controllers.splice(0).forEach(controller => controller.destroy())
  vi.unstubAllGlobals()
})

describe('native-quantized auto-scroll distance', () => {
  // Native Dev/WebView2 DPR1 proof: fractional assignments round to the nearest
  // integer; the old controller travelled 0/300/3300 instead of 100/400/3200.
  it.each([20, 80, 640])('integrates %ipx/s over five seconds without rounding feedback', speed => {
    const f = fixture(speed)
    tick(0)
    for (let frame = 1; frame <= 300; frame++) tick(frame * 1000 / 60)
    expect(f.target.position()).toBe(speed * 5)
    expect(f.target.writes).toHaveLength(300)
  })

  it.each([Math.round, (value: number) => Math.floor(value * 4) / 4])(
    'uses actual readback rather than assuming a rounding quantum (%#)', quantize => {
      const f = fixture(80, scroller(quantize))
      tick(0)
      for (let frame = 1; frame <= 300; frame++) tick(frame * 1000 / 60)
      expect(f.target.position()).toBeCloseTo(400, 8)
    },
  )

  it('preserves fractional native read values', () => {
    const f = fixture(20, scroller(value => value, 1.125))
    tick(0); tick(10); tick(20)
    expect(f.target.position()).toBeCloseTo(1.525, 10)
  })

  it.each([10, 3.25])('rebases exactly on a manual or anchor change to %s without consuming its own residue', external => {
    const f = fixture(20, scroller(Math.round, 5))
    tick(0); tick(10) // Unapplied own 0.2px.
    f.target.external(external)
    tick(20)
    expect(f.target.writes.at(-1)).toBeCloseTo(external + 0.2, 10)
    expect(f.target.position()).toBe(Math.round(external + 0.2))
  })

  it('detects even a subpixel external change without a tolerance', () => {
    const f = fixture(20, scroller(value => value, 1))
    tick(0); tick(10)
    f.target.external(1.201)
    tick(20)
    expect(f.target.writes.at(-1)).toBeCloseTo(1.401, 10)
  })

  it('does not accumulate overshoot at the bottom before content is appended', () => {
    const f = fixture(20, scroller(Math.round, 2, 2))
    tick(0)
    for (let frame = 1; frame <= 100; frame++) tick(frame * 10)
    expect(f.target.position()).toBe(2)
    f.target.limit(100)
    tick(1010)
    expect(f.target.writes.at(-1)).toBeCloseTo(2.2, 10)
  })

  it('clears negative residue when native quantization reaches the upper bound', () => {
    const f = fixture(60, scroller(Math.round, 1, 2))
    tick(0); tick(10) // Request1.6, native2: no -0.4px debt after append.
    expect(f.target.position()).toBe(2)
    f.target.limit(100); tick(20)
    expect(f.target.writes.at(-1)).toBeCloseTo(2.6, 10)
  })

  it('rebases after shrinking bounds and does not repay clipped movement later', () => {
    const f = fixture(20, scroller(Math.round, 20))
    tick(0); tick(10)
    f.target.limit(2); tick(20)
    expect(f.target.position()).toBe(2)
    f.target.limit(100); tick(30)
    expect(f.target.writes.at(-1)).toBeCloseTo(2.2, 10)
  })

  it.each(['pause', 'enable'] as const)('resets fractional state on %s/resume without elapsed-time catchup', mode => {
    const f = fixture()
    tick(0); tick(10)
    if (mode === 'pause') { f.controller.setPaused(true); f.controller.setPaused(false) }
    else { f.controller.setEnabled(false); f.controller.setEnabled(true) }
    tick(1000); tick(1010)
    expect(f.target.writes.at(-1)).toBeCloseTo(0.2, 10)
  })

  it('resets residue and clock while the owner is absent', () => {
    const f = fixture()
    tick(0); tick(10)
    f.owner(null); tick(20)
    f.owner(f.target.element); tick(1000); tick(1010)
    expect(f.target.writes.at(-1)).toBeCloseTo(0.2, 10)
  })

  it('keeps the original frame delta but transfers no residue to a different owner', () => {
    const f = fixture(), next = scroller(Math.round, 50)
    tick(0); tick(10)
    f.owner(next.element); tick(20)
    expect(next.writes.at(-1)).toBeCloseTo(50.2, 10)
    expect(f.target.writes).toHaveLength(1)
  })

  it('integrates a changed/clamped speed with the existing fraction and original 100ms stall cap', () => {
    const f = fixture()
    tick(0); tick(10)
    f.controller.setSpeed(80); tick(20)
    expect(f.target.writes.at(-1)).toBeCloseTo(1, 10)
    f.controller.setSpeed(1000)
    expect(f.state.speedPxPerSecond).toBe(640)
    tick(1020)
    expect(f.target.writes.at(-1)).toBeCloseTo(65, 10)
    f.controller.setSpeed(1)
    expect(f.state.speedPxPerSecond).toBe(20)
  })

  it('takes one exact post-write readback and cancels all work on destroy', () => {
    const f = fixture()
    tick(0); tick(10)
    expect(f.target.reads()).toBe(2)
    f.controller.destroy()
    expect(frames.size).toBe(0)
  })
})
