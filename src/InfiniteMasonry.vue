<script setup>

import {computed, nextTick, onMounted, onUnmounted, ref} from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default(){
      return [];
    }
  },
  callbacks: {
    load: {
      type: Function,
      required: true
    },
    loadNext: {
      type: Function,
      required: true
    },
  },
  sizes: {
    type: Object,
    default(){
      return {
        0: 1,
        640: 2,
        768: 3,
        1024: 4,
        1280: 5,
        1536: 6,
        1792: 7,
        2048: 8,
      }
    }
  }
})

const columns = ref(6);
const isLoading = ref(false);
const isLoadingNext = ref(false);

const containerSize = ref(0);

const getContainerClasses = computed(() => {
  return {
    'grid-cols-1': columns.value === 1,
    'grid-cols-2': columns.value === 2,
    'grid-cols-3': columns.value === 3,
    'grid-cols-4': columns.value === 4,
    'grid-cols-5': columns.value === 5,
    'grid-cols-6': columns.value === 6,
    'grid-cols-7': columns.value === 7,
    'grid-cols-8': columns.value === 8,
  }
});

const groupedItems = computed(() => {
  return props.modelValue.reduce((acc, item, index) => {
    const n = index % columns.value;
    if (!acc[n]) {
      acc[n] = [];
    }
    acc[n].push(item);
    return acc;
  }, [])
})

const visibleColumnEnds = ref(new Set());

onMounted(async () => {
  updateContainerSize();
  window.addEventListener('resize', updateContainerSize);

  isLoading.value = true;
  await props.callbacks.load();
  isLoading.value = false;
  await nextTick();
  observeColumnEnds();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize);
  if (observer) observer.disconnect();
});

const updateContainerSize = () => {
  const width = window.innerWidth;
  const newSize = Object.keys(props.sizes).reduce((acc, size) => {
    return width >= Number(size) ? size : acc;
  }, 0);

  if (newSize !== containerSize.value) {
    containerSize.value = newSize;
    columns.value = props.sizes[newSize];
  }
};

let observer = null;

const observeColumnEnds = () => {
  if (observer) observer.disconnect(); // clear previous one

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const column = Number(entry.target.getAttribute('data-column'));
      if (entry.isIntersecting) {
        visibleColumnEnds.value.add(column);
      } else {
        visibleColumnEnds.value.delete(column);
      }
    });

    if (visibleColumnEnds.value.size > 0 && !isLoadingNext.value) {
      isLoadingNext.value = true;

      props.callbacks.loadNext().then(() => {
        isLoadingNext.value = false;
      });
    }
  });

  groupedItems.value.forEach((group, index) => {
    const lastItem = document.querySelector(`[data-column="${index}"][data-last="true"]`);
    if (lastItem) {
      observer.observe(lastItem);
    }
  });
};
</script>

<template>
  <div class="grid w-full gap-4" :class="getContainerClasses">
    <div v-for="column in columns" :key="column" class="flex flex-col gap-4">
      <div v-for="(item, index) in groupedItems[column - 1]" :key="item.id"
                :data-column="column - 1"
                :data-last="index === groupedItems[column - 1].length - 1">
        <slot name="item"
              :item="item"
              :index="index"
              :column="column"
              :items="groupedItems[column - 1]">
          <!-- Default / fallback content -->
          <div class="bg-slate-300 w-full rounded-lg shadow-lg p-4"
               :style="{ height: `${Math.floor(Math.random() * 200) + 200}px` }">
            {{ `item-${item.index}` }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
