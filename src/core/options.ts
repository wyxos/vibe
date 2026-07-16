import { validateAutofillOptions } from './autofill'
import { validateFillOptions } from './fill'
import type { CreateVibeOptions, VibeCardRegion } from '../types'

function validateCardRegion(
  name: 'cardFooter' | 'cardHeader',
  region?: VibeCardRegion,
): void {
  if (!region) return
  if (!Number.isFinite(region.height) || region.height <= 0) {
    throw new TypeError(`Vibe ${name} height must be a positive number.`)
  }
}

export function validateOptions(options: CreateVibeOptions): void {
  validateCardRegion('cardHeader', options.cardHeader)
  validateCardRegion('cardFooter', options.cardFooter)
  validateAutofillOptions(options.autofill)
  validateFillOptions(options.fill)

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
