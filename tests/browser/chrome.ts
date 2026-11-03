import { defineComponent, h, ref } from 'vue'
import type { PropType } from 'vue'
import type { VibeItem, VibeMediaControlsDrawerProps } from '../../src/index'

export const TrackDrawer = defineComponent({
  props: {
    media: { type: Object as PropType<VibeMediaControlsDrawerProps['media']>, required: true },
    actions: { type: Array as PropType<VibeMediaControlsDrawerProps['actions']>, required: true },
    close: { type: Function as PropType<VibeMediaControlsDrawerProps['close']>, required: true },
    selectAction: { type: Function as PropType<VibeMediaControlsDrawerProps['selectAction']>, required: true },
  },
  inheritAttrs: false,
  setup: props => () => h('section', {
    style: { background: '#132b45', color: 'white', padding: '24px' },
  }, [
    h('h2', `Tracks for post ${props.media.item.postId}`),
    ...props.actions.map(action => h('button', {
      type: 'button', 'aria-pressed': action.selected, onClick: () => props.selectAction(action),
    }, action.label)),
    h('button', { type: 'button', onClick: props.close }, 'Done'),
  ]),
})

export const Header = defineComponent({
  props: { item: { type: Object as PropType<VibeItem>, required: true } },
  setup(props) {
    const expanded = ref(false)
    return () => h('div', { class: 'test-chrome' }, [
      h('button', { onClick: () => { expanded.value = !expanded.value } }, `Information ${props.item.postId}`),
      expanded.value ? h('span', { 'data-test': 'custom-details' }, 'Custom header') : null,
    ])
  },
})

export const Footer = defineComponent({
  props: { index: Number, loadedCount: Number },
  setup(props) {
    const liked = ref(false)
    return () => h('div', { class: 'test-chrome' }, [
      h('span', { 'data-test': 'position' }, `${(props.index ?? 0) + 1} / ${props.loadedCount}`),
      h('button', { 'aria-pressed': liked.value, onClick: () => { liked.value = !liked.value } }, 'Like'),
    ])
  },
})

export const InfoSheet = defineComponent({
  props: {
    item: { type: Object as PropType<VibeItem>, required: true },
    close: { type: Function as PropType<() => void>, required: true },
  },
  setup: (props) => () => h('section', { class: 'test-sheet', 'data-context-post-id': props.item.postId }, [
    h('button', { onClick: props.close }, 'Close information'),
    h('p', `Post ${props.item.postId}`),
    h('input', { 'aria-label': 'Test field' }),
  ]),
})
