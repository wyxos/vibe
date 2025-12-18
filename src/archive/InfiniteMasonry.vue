<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watchEffect} from "vue";

const scrollPosition = ref(0);
const scrollDirection = ref('down');

const defaultOptions = {
  sizes: {
    1: {min: 0,},
    2: {min: 401,},
    4: {min: 801,},
    6: {min: 1201,},
    8: {min: 1601,},
    10: {min: 2001,},
  },
  gutterX: 10,
  gutterY: 10,
  cellPadding: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
};

const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options,
  sizes: props.options?.sizes ?? defaultOptions.sizes
}));


const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

const columnsCount = ref(7);

const internalColumnHeights = ref([]);

const maximumHeight = computed(() => Math.max(...internalColumnHeights.value));

const container = ref(null);

const layouts = ref([]); // contains { id, top, left, width, height, src }

watchEffect(() => {
  if (!container.value) return;

  const scrollbarWidth = getScrollbarWidth(); // ← add this
  const containerWidth = container.value.offsetWidth - scrollbarWidth;
  const totalGutterX = (columnsCount.value - 1) * mergedOptions.value.gutterX;
  const colWidth = Math.floor((containerWidth - totalGutterX) / columnsCount.value);
  const colHeights = Array(columnsCount.value).fill(0);

  const flatItems = props.modelValue.flatMap(p => p.items);
  layouts.value = flatItems.map((item, index) => {
    const columnIndex = index % columnsCount.value;
    const scaledHeight = Math.round((item.height / item.width) * colWidth);
    const top = colHeights[columnIndex];
    const left = columnIndex * (colWidth + mergedOptions.value.gutterX);

    // update cumulative column height
    colHeights[columnIndex] += scaledHeight + mergedOptions.value.gutterY;

    return {
      ...item,
      width: colWidth,
      height: scaledHeight,
      top,
      left
    };
  });

  internalColumnHeights.value = colHeights;
});

const visibleItems = computed(() => {
  const scroll = scrollPosition.value;
  const viewHeight = container.value?.offsetHeight || 0;

  return layouts.value.filter(item => {
    return (
        item.top + item.height >= scroll - 200 &&
        item.top <= scroll + viewHeight + 200
    );
  });
});

const getScrollbarWidth = () => {
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar'; // for IE
  outer.style.position = 'absolute';
  outer.style.top = '-9999px';
  outer.style.width = '100px';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  inner.style.width = '100%';
  outer.appendChild(inner);

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  document.body.removeChild(outer);
  return scrollbarWidth;
};

const emit = defineEmits(['update:modelValue', 'scroll']);

const onScroll = () => {
  const el = container.value;
  if (!el) return;

  const scroll = el.scrollTop;
  const viewHeight = el.clientHeight;
  const contentHeight = el.scrollHeight;

  const threshold = 50; // pixels from bottom (you can tweak this)

  scrollDirection.value = scroll > scrollPosition.value ? 'down' : 'up';
  scrollPosition.value = scroll;

  const isEnd = scroll + viewHeight >= contentHeight - threshold;
  const isStart = scroll <= threshold;

  const viewportBottom = scroll + viewHeight;
  const hasShortColumn = internalColumnHeights.value.some(height => height < viewportBottom - 50);

  emit('scroll', {
    position: scroll,
    direction: scrollDirection.value,
    isEnd,
    isStart,
    hasShortColumn
  });
};

const onResize = () => {
  const scrollbarWidth = getScrollbarWidth();
  const containerWidth = container.value.offsetWidth - scrollbarWidth;
  columnsCount.value = 0;

  const sizes = mergedOptions.value.sizes;

  const sortedSizes = Object.entries(sizes).sort(
      (a, b) => a[1].min - b[1].min
  );

  for (const [columns, { min }] of sortedSizes) {
    if (containerWidth >= min) {
      columnsCount.value = Number(columns);
    }
  }
};

const getCellPosition = (item) => {
  return {
    top: item.top + 'px',
    left: item.left + 'px',
    width: item.width + 'px',
    height: item.height + 'px'
  }
}

const remove = () => {

}

const restore = () => {

}

defineExpose({
  remove,
  restore
})

onMounted(async () => {
  await nextTick(); // wait for DOM to render and size
  onResize(); // now has proper width
  container.value?.addEventListener('scroll', onScroll);
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('scroll', onScroll);
  }

  window.removeEventListener('resize', onResize);
})
</script>

<template>
  <div ref="container" class="overflow-auto flex-1 h-full w-full">
    <div :style="{ height: `${maximumHeight}px` }" class="relative w-full">
      <template v-for="item in visibleItems" :key="item.id">
        <slot name="cell" :item="item" :get-cell-position="getCellPosition">
          <div
              class="absolute bg-slate-200 rounded-lg shadow-lg"
              :style="getCellPosition(item)"
          >
            <img :src="item.src" class="w-full h-auto"/>
          </div>
        </slot>
      </template>
    </div>
  </div>
</template>
