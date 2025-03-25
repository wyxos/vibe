<script setup>
import {computed, onMounted, ref, watchEffect} from "vue";

const scrollPosition = ref(0);
const scrollDirection = ref('down');

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  options: {
    type: Object,
    default: () => ({
      columns: 7,
      gutterX: 10,
      gutterY: 10,

    })
  }
})

const internalColumnHeights = ref([]);

const maximumHeight = computed(() => Math.max(...internalColumnHeights.value));

const container = ref(null);

const layouts = ref([]); // contains { id, top, left, width, height, src }

watchEffect(() => {
  if (!container.value) return;

  const scrollbarWidth = getScrollbarWidth(); // ← add this
  const containerWidth = container.value.offsetWidth - scrollbarWidth;
  const totalGutterX = (props.options.columns - 1) * props.options.gutterX;
  const colWidth = Math.floor((containerWidth - totalGutterX) / props.options.columns);
  const colHeights = Array(props.options.columns).fill(0);

  layouts.value = props.items.map((item, index) => {
    const columnIndex = index % props.options.columns;
    const scaledHeight = Math.round((item.height / item.width) * colWidth);
    const top = colHeights[columnIndex];
    const left = columnIndex * (colWidth + props.options.gutterX);

    // update cumulative column height
    colHeights[columnIndex] += scaledHeight + props.options.gutterY;

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

const emit = defineEmits(['scroll']);

onMounted(() => {
  container.value.addEventListener('scroll', () => {

    if (container.value.scrollTop > scrollPosition.value) {
      scrollDirection.value = 'down';
    } else {
      scrollDirection.value = 'up';
    }

    scrollPosition.value = container.value.scrollTop;

    emit('scroll', scrollPosition.value, scrollDirection.value);
  });
})
</script>

<template>
  <div ref="container" class="masonry-container overflow-auto flex-1 w-full">
    <div :style="{ height: `${maximumHeight}px` }" class="relative w-full">
      <template v-for="item in visibleItems" :key="item.id">
        <div
            class="absolute bg-slate-200 rounded-lg shadow-lg"
            :style="{
      top: item.top + 'px',
      left: item.left + 'px',
      width: item.width + 'px',
      height: item.height + 'px'
    }"
        >
          <img :src="item.src" class="w-full h-auto" />
        </div>
      </template>
    </div>
  </div>
</template>
