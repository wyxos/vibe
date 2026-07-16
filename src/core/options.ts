import { validateAutofillOptions } from './autofill'
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

  if (!options.initialPage && !options.loadPage) {
    throw new TypeError('Vibe requires either initialPage or loadPage.')
  }

  if (options.initialPage?.next !== null && !options.loadPage) {
    throw new TypeError('Vibe requires loadPage when initialPage has a next cursor.')
  }
}
