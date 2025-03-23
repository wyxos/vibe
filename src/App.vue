<script setup>
import InfiniteMasonry from "./InfiniteMasonry.vue";
import {onMounted, ref} from "vue";

const files = ref([]);

const load = async () => {
  // create an array of object with uuid and an image with random dimensions
  const data = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(Array.from({length: 60}, (_, index) => ({
        id: index,
        index: index,
        src: `https://picsum.photos/${Math.floor(Math.random() * 200) + 200}/${Math.floor(Math.random() * 200) + 200}?random=${index}`
      })))
    }, 1500)
  })

  files.value = data;
}

const loadNext = async () => {
  const currentLength = files.value.length;


  const data = await new Promise((resolve) => {
    setTimeout(() => {
      resolve(Array.from({length: 60}, (_, index) => ({
        id: index + currentLength,
        index: index + currentLength,
        src: `https://picsum.photos/${Math.floor(Math.random() * 200) + 200}/${Math.floor(Math.random() * 200) + 200}?random=${index + currentLength}`
      }))
      )
    }, 1500)
  })

  files.value = [...files.value, ...data];
}

onMounted(async () => {
});
</script>

<template>
  <div class="flex flex-col items-center p-4 bg-slate-100 min-h-screen">
    <h1 class="text-2xl font-semibold mb-6">Vue infinite masonry</h1>

    <infinite-masonry v-model="files" :callbacks="{ load, loadNext}">
      <template #item="{ item, items, column }">
        <div class="bg-slate-500 min-h-30">
          <img :src="item.src" class="w-full h-auto" />
          {{ item.index}}
        </div>
        {{ items[column - 1]?.length }}
      </template>
    </infinite-masonry>
  </div>
</template>
