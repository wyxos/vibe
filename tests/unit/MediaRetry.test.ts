import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'

import MediaCard from '@/components/MediaCard.vue'

function mediaAsset(name: string) {
  return {
    src: `https://example.com/${name}.jpg`,
    preview: {
      src: `https://example.com/${name}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
  }
}

function props() {
  return {
    active: true,
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    interactive: true,
    item: {
      postId: 10,
      ...mediaAsset('10'),
      items: [],
    },
    layout: 'reel' as const,
    loadedCount: 1,
    mediaIndex: 0,
    previewState: 'error' as const,
    total: null,
  }
}

describe('MediaCard retry', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('guards pointer and keyboard retry without activating the card', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const wrapper = mount(MediaCard, {
      attachTo: document.body,
      props: props(),
    })
    await wrapper.vm.$nextTick()

    const firstImage = wrapper.get('img').element
    const retry = wrapper.get('[data-test="media-retry"]')
    expect(retry.element.tagName).toBe('BUTTON')
    ;(retry.element as HTMLButtonElement).focus()
    expect(document.activeElement).toBe(retry.element)

    await retry.trigger('click')
    expect(wrapper.get('[data-test="media-error"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('[data-test="media-retry"]').attributes()).toHaveProperty('disabled')
    expect(wrapper.get('[data-test="media-retry"]').text()).toBe('Retrying…')
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.get('img').element).not.toBe(firstImage)
    expect(wrapper.get('.media-card-frame').classes())
      .not.toContain('media-slide-next-enter-active')
    expect(wrapper.emitted('activate')).toBeUndefined()

    const pointerRetryImage = wrapper.get('img').element
    ;(wrapper.get('[data-test="media-retry"]').element as HTMLButtonElement).click()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('img').element).toBe(pointerRetryImage)

    await wrapper.get('img').trigger('error')
    const keyboardRetry = wrapper.get('[data-test="media-retry"]')
    expect(keyboardRetry.attributes()).not.toHaveProperty('disabled')
    await keyboardRetry.trigger('keydown', { key: 'Enter' })
    await keyboardRetry.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('activate')).toBeUndefined()

    const failedImage = wrapper.get('img').element
    ;(keyboardRetry.element as HTMLButtonElement).click()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-test="media-retry"]').text()).toBe('Retrying…')
    expect(wrapper.get('img').element).not.toBe(failedImage)
    expect(wrapper.emitted('error')).toEqual([[0]])
    expect(wrapper.emitted('activate')).toBeUndefined()

    await wrapper.get('img').trigger('load')
    expect(wrapper.emitted('ready')).toEqual([[0]])
    await wrapper.setProps({ previewState: 'ready' })
    expect(wrapper.find('[data-test="media-error"]').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('media-preview--ready')

    wrapper.unmount()
  })

  it('gives custom error UI guarded Vibe-owned retry state', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const CustomError = markRaw(defineComponent({
      props: ['label', 'retry', 'retrying', 'status'],
      setup: (customProps) => () => h('button', {
        'data-test': 'custom-media-retry',
        'disabled': customProps.retrying,
        'onClick': customProps.retry,
      }, customProps.retrying
        ? 'Trying again'
        : `${customProps.status}: ${customProps.label}`),
    }))
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        mediaCard: { error: { component: CustomError } },
      },
    })
    await wrapper.vm.$nextTick()

    const retry = wrapper.get('[data-test="custom-media-retry"]')
    const firstImage = wrapper.get('img').element
    expect(retry.text()).toBe('Error: Preview unavailable')

    await retry.trigger('click')
    expect(wrapper.get('[data-test="custom-media-retry"]').text()).toBe('Trying again')
    expect(wrapper.get('img').element).not.toBe(firstImage)
    const retryImage = wrapper.get('img').element

    await wrapper.get('[data-test="custom-media-retry"]').trigger('click')
    expect(wrapper.get('img').element).toBe(retryImage)
    expect(wrapper.emitted('activate')).toBeUndefined()

    await wrapper.get('img').trigger('error')
    expect(wrapper.get('[data-test="custom-media-retry"]').text())
      .toBe('Error: Preview unavailable')
  })
})
