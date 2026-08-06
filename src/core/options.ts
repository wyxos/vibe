import { validateAutofillOptions } from './autofill'
import { validateAutoScrollOptions } from './autoScroll'
import { validateFillOptions } from './fill'
import { validateMasonryOptions } from './masonryOptions'
import { validateReelAutoAdvanceOptions } from './reelAutoAdvance'
import type {
  CreateVibeOptions,
  VibeCardChromeStyle,
  VibeCardRegion,
} from '../types'

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

function validateCardChromeStyle(
  name: 'footer' | 'header',
  style?: VibeCardChromeStyle,
): void {
  if (!style) return
  if (style.background !== undefined
    && style.background !== 'default'
    && style.background !== 'transparent') {
    throw new TypeError(
      `Vibe mediaCard ${name} background must be "default" or "transparent".`,
    )
  }
  for (const [property, value] of [
    ['paddingX', style.paddingX],
    ['paddingY', style.paddingY],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new TypeError(
        `Vibe mediaCard ${name} ${property} must be a non-negative number.`,
      )
    }
  }
}

export function validateOptions(options: CreateVibeOptions): void {
  validateAutoScrollOptions(options.autoScroll)
  validateCardRegion('cardHeader', options.cardHeader)
  validateCardRegion('cardFooter', options.cardFooter)
  validateCardChromeStyle('header', options.mediaCard?.header)
  validateCardChromeStyle('footer', options.mediaCard?.footer)
  validateAutofillOptions(options.autofill)
  validateFillOptions(options.fill)
  validateMasonryOptions(options.masonry)
  validateReelAutoAdvanceOptions(options.reelAutoAdvance)

  if (options.removalReconciliation) {
    if (!Number.isInteger(options.removalReconciliation.pageSize)
      || options.removalReconciliation.pageSize <= 0) {
      throw new TypeError(
        'Vibe removalReconciliation pageSize must be a positive integer.',
      )
    }
    const maximum = options.removalReconciliation.maxReplayPages ?? 5
    if (!Number.isInteger(maximum) || maximum <= 0) {
      throw new TypeError(
        'Vibe removalReconciliation maxReplayPages must be a positive integer.',
      )
    }
    if (!options.loadPage) {
      throw new TypeError('Vibe removalReconciliation requires loadPage.')
    }
    if (options.autofill?.strategy === 'backend') {
      throw new TypeError(
        'Vibe removalReconciliation does not support backend autofill.',
      )
    }
    if (options.fill?.strategy === 'backend') {
      throw new TypeError(
        'Vibe removalReconciliation does not support backend fill.',
      )
    }
  }

  if (options.removalHistoryLimit !== undefined
    && (!Number.isInteger(options.removalHistoryLimit)
      || options.removalHistoryLimit < 0)) {
    throw new TypeError(
      'Vibe removalHistoryLimit must be a non-negative integer.',
    )
  }

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
