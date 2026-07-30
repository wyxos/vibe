import { validateAutofillOptions } from './autofill'
import { validateAutoScrollOptions } from './autoScroll'
import { validateFillOptions } from './fill'
import { validateReelAutoAdvanceOptions } from './reelAutoAdvance'
import type { CreateVibeOptions, VibeCardRegion } from '../types'

function validateCardRegion(
  name: 'cardFooter' | 'cardHeader',
  region?: VibeCardRegion,
): void {
  if (!region) return
  if (!Number.isFinite(region.height) || region.height <= 0) {
    throw new TypeError(`Vibe ${name} height must be a positive number.`)
  }
  if (region.background !== undefined
    && region.background !== 'default'
    && region.background !== 'transparent') {
    throw new TypeError(
      `Vibe ${name} background must be "default" or "transparent".`,
    )
  }
}

export function validateOptions(options: CreateVibeOptions): void {
  validateAutoScrollOptions(options.autoScroll)
  validateCardRegion('cardHeader', options.cardHeader)
  validateCardRegion('cardFooter', options.cardFooter)
  validateAutofillOptions(options.autofill)
  validateFillOptions(options.fill)
  validateReelAutoAdvanceOptions(options.reelAutoAdvance)

  if (!options.initialPage && !options.loadPage) {
    throw new TypeError('Vibe requires either initialPage or loadPage.')
  }

  if (options.initialPage?.next !== null && !options.loadPage) {
    throw new TypeError('Vibe requires loadPage when initialPage has a next cursor.')
  }

  if (options.fill?.strategy === 'frontend' && !options.loadPage) {
    throw new TypeError('Vibe frontend fill requires loadPage.')
  }

  if (options.fill?.strategy === 'backend' && options.fill.initialSession
    && !options.initialPage) {
    throw new TypeError('Vibe backend fill restoration requires initialPage.')
  }
}

export function resolveVibeTarget(target: CreateVibeOptions['target']): Element {
  if (typeof target !== 'string') return target
  if (typeof document === 'undefined') {
    throw new Error('Vibe cannot resolve a selector without a document.')
  }

  const element = document.querySelector(target)
  if (!element) throw new Error(`Vibe target not found: ${target}`)
  return element
}
