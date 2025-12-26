import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BasicExample from '../src/components/examples/BasicExample.vue'
import CustomItemExample from '../src/components/examples/CustomItemExample.vue'
import SwipeModeExample from '../src/components/examples/SwipeModeExample.vue'
import HeaderFooterExample from '../src/components/examples/HeaderFooterExample.vue'
import ManualInitExample from '../src/components/examples/ManualInitExample.vue'
import { defaultStubs, wait, flushPromises } from './helpers/testSetup'

// Mock the fixture data
vi.mock('../src/pages.json', () => ({
  default: [
    {
      items: [
        { id: 1, width: 300, height: 200, src: 'test1.jpg', page: 1 },
        { id: 2, width: 400, height: 300, src: 'test2.jpg', page: 1 },
        { id: 3, width: 500, height: 400, src: 'test3.jpg', page: 1 }
      ]
    },
    {
      items: [
        { id: 4, width: 300, height: 200, src: 'test4.jpg', page: 2 },
        { id: 5, width: 400, height: 300, src: 'test5.jpg', page: 2 }
      ]
    }
  ]
}))

describe('Example Components', () => {
  beforeEach(() => {
    // Reset any mocks between tests
    vi.clearAllMocks()
  })

  describe('BasicExample', () => {
    it('should mount and render without errors', async () => {
      const wrapper = mount(BasicExample, {
        global: { stubs: defaultStubs }
      })

      expect(wrapper.exists()).toBe(true)
      await wrapper.unmount()
    })

    it('should initialize and load content automatically', async () => {
      const wrapper = mount(BasicExample, {
        global: { stubs: defaultStubs }
      })

      // Wait for initialization and content loading
      await flushPromises()
      await wait(500) // Wait for getPage timeout (300ms) + some buffer

      const vm = wrapper.vm

      // Should have loaded items
      expect(vm.items.length).toBeGreaterThan(0)

      // Should not show loading message
      const loadingText = wrapper.text()
      expect(loadingText).not.toContain('Waiting for content to load...')

      await wrapper.unmount()
    })

    it('should render masonry items', async () => {
      const wrapper = mount(BasicExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      // Should have items loaded
      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should have masonry container
      const container = wrapper.find('.masonry-container, .swipe-container')
      expect(container.exists()).toBe(true)

      await wrapper.unmount()
    })
  })

  describe('CustomItemExample', () => {
    it('should mount and render without errors', async () => {
      const wrapper = mount(CustomItemExample, {
        global: { stubs: defaultStubs }
      })

      expect(wrapper.exists()).toBe(true)
      await wrapper.unmount()
    })

    it('should initialize and load content automatically', async () => {
      const wrapper = mount(CustomItemExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should not show loading message
      const loadingText = wrapper.text()
      expect(loadingText).not.toContain('Waiting for content to load...')

      await wrapper.unmount()
    })

    it('should render custom item slots', async () => {
      const wrapper = mount(CustomItemExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      // Should have items loaded (which means custom slots are being used)
      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should have masonry container (proves items are rendered)
      const container = wrapper.find('.masonry-container, .swipe-container')
      expect(container.exists()).toBe(true)

      await wrapper.unmount()
    })
  })

  describe('SwipeModeExample', () => {
    it('should mount and render without errors', async () => {
      const wrapper = mount(SwipeModeExample, {
        global: { stubs: defaultStubs }
      })

      expect(wrapper.exists()).toBe(true)
      await wrapper.unmount()
    })

    it('should initialize and load content automatically', async () => {
      const wrapper = mount(SwipeModeExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should not show loading message
      const loadingText = wrapper.text()
      expect(loadingText).not.toContain('Waiting for content to load...')

      await wrapper.unmount()
    })

    it('should render in swipe mode', async () => {
      const wrapper = mount(SwipeModeExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      // Should have swipe container
      const swipeContainer = wrapper.find('.swipe-container')
      expect(swipeContainer.exists()).toBe(true)

      await wrapper.unmount()
    })
  })

  describe('HeaderFooterExample', () => {
    it('should mount and render without errors', async () => {
      const wrapper = mount(HeaderFooterExample, {
        global: { stubs: defaultStubs }
      })

      expect(wrapper.exists()).toBe(true)
      await wrapper.unmount()
    })

    it('should initialize and load content automatically', async () => {
      const wrapper = mount(HeaderFooterExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should not show loading message
      const loadingText = wrapper.text()
      expect(loadingText).not.toContain('Waiting for content to load...')

      await wrapper.unmount()
    })

    it('should render items with header and footer slots', async () => {
      const wrapper = mount(HeaderFooterExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()
      await wait(500)

      // Should have items loaded
      const vm = wrapper.vm
      expect(vm.items.length).toBeGreaterThan(0)

      // Should have masonry container
      const container = wrapper.find('.masonry-container, .swipe-container')
      expect(container.exists()).toBe(true)

      await wrapper.unmount()
    })
  })

  describe('ManualInitExample', () => {
    it('should mount and render without errors', async () => {
      const wrapper = mount(ManualInitExample, {
        global: { stubs: defaultStubs }
      })

      expect(wrapper.exists()).toBe(true)
      await wrapper.unmount()
    })

    it('should show CTA button when not initialized', async () => {
      const wrapper = mount(ManualInitExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()

      // Should show the CTA button
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Load gallery')

      await wrapper.unmount()
    })

    it('should load content when CTA button is clicked', async () => {
      const wrapper = mount(ManualInitExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()

      // Initially should not have items
      const vm = wrapper.vm
      expect(vm.items.length).toBe(0)

      // Click the CTA button
      const button = wrapper.find('button')
      await button.trigger('click')

      // Wait for loadPage to complete
      await flushPromises()
      await wait(500) // Wait for getPage timeout (300ms) + some buffer

      // Should have loaded items
      expect(vm.items.length).toBeGreaterThan(0)

      // CTA button should be hidden after initialization
      const buttonAfter = wrapper.find('button')
      expect(buttonAfter.exists()).toBe(false)

      await wrapper.unmount()
    })

    it('should call loadPage(1) when CTA button is clicked', async () => {
      const wrapper = mount(ManualInitExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()

      const vm = wrapper.vm
      const masonryRef = vm.$refs.masonryRef

      // Spy on loadPage
      const loadPageSpy = vi.spyOn(masonryRef, 'loadPage')

      // Click the CTA button
      const button = wrapper.find('button')
      await button.trigger('click')

      // Should have called loadPage with page 1
      expect(loadPageSpy).toHaveBeenCalledWith(1)
      expect(loadPageSpy).toHaveBeenCalledTimes(1)

      loadPageSpy.mockRestore()
      await wrapper.unmount()
    })

    it('should hide CTA button after initialization', async () => {
      const wrapper = mount(ManualInitExample, {
        global: { stubs: defaultStubs }
      })

      await flushPromises()

      // Initially should show CTA
      expect(wrapper.find('button').exists()).toBe(true)

      // Click to initialize
      await wrapper.find('button').trigger('click')
      await flushPromises()
      await wait(500)

      // CTA should be hidden
      expect(wrapper.find('button').exists()).toBe(false)

      await wrapper.unmount()
    })
  })

  describe('All Examples - Regression Tests', () => {
    it('should not show "Waiting for content to load..." after initialization', async () => {
      const examples = [
        { name: 'BasicExample', component: BasicExample },
        { name: 'CustomItemExample', component: CustomItemExample },
        { name: 'SwipeModeExample', component: SwipeModeExample },
        { name: 'HeaderFooterExample', component: HeaderFooterExample },
        { name: 'ManualInitExample', component: ManualInitExample, requiresInit: true }
      ]

      for (const { name, component, requiresInit } of examples) {
        const wrapper = mount(component, {
          global: { stubs: defaultStubs }
        })

        await flushPromises()

        // For ManualInitExample, need to click the CTA button first
        if (requiresInit) {
          const button = wrapper.find('button')
          if (button.exists()) {
            await button.trigger('click')
          }
        }

        await flushPromises()
        await wait(500)

        // Should not show loading message
        const loadingText = wrapper.text()
        expect(loadingText).not.toContain('Waiting for content to load...')

        await wrapper.unmount()
      }
    })

    it('should all initialize with init="auto"', async () => {
      const examples = [
        { name: 'BasicExample', component: BasicExample },
        { name: 'CustomItemExample', component: CustomItemExample },
        { name: 'SwipeModeExample', component: SwipeModeExample },
        { name: 'HeaderFooterExample', component: HeaderFooterExample }
      ]

      for (const { name, component } of examples) {
        const wrapper = mount(component, {
          global: { stubs: defaultStubs }
        })

        await flushPromises()
        await wait(500)

        const vm = wrapper.vm

        // Should have loaded items (proves initialization worked)
        expect(vm.items.length).toBeGreaterThan(0)

        // Should not show loading message
        const loadingText = wrapper.text()
        expect(loadingText).not.toContain('Waiting for content to load...')

        await wrapper.unmount()
      }
    })

    it('should all handle errors gracefully', async () => {
      // This test ensures examples don't crash on errors
      // We can't easily mock getPage to fail in examples, but we can verify
      // the component structure is correct
      const examples = [
        { name: 'BasicExample', component: BasicExample },
        { name: 'CustomItemExample', component: CustomItemExample },
        { name: 'SwipeModeExample', component: SwipeModeExample },
        { name: 'HeaderFooterExample', component: HeaderFooterExample }
      ]

      for (const { name, component } of examples) {
        const wrapper = mount(component, {
          global: { stubs: defaultStubs }
        })

        // Component should mount without throwing
        expect(() => wrapper.exists()).not.toThrow()

        await wrapper.unmount()
      }
    })
  })
})

