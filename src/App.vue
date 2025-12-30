<script setup>
import { onMounted, ref } from 'vue'
import { fetchPage } from './fakeServer'

const isLoading = ref(true)
const error = ref('')
const pageData = ref(null)

onMounted(async () => {
  try {
    isLoading.value = true
    error.value = ''
    pageData.value = await fetchPage(1)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container">
    <h1>Vibe</h1>

    <p v-if="isLoading">Loading page 1…</p>
    <p v-else-if="error">Error: {{ error }}</p>

    <div v-else class="grid">
      <article v-for="item in pageData.items" :key="item.id" class="card">
        <img
          v-if="item.type === 'image'"
          class="media"
          :src="item.src"
          :width="item.width"
          :height="item.height"
          loading="lazy"
          :alt="item.id"
        />

        <video
          v-else
          class="media"
          :poster="item.poster"
          controls
          preload="metadata"
        >
          <source :src="item.src" type="video/mp4" />
        </video>

        <div class="meta">
          <span>{{ item.type }}</span>
          <span>{{ item.id }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: red;
  padding: 24px;
  box-sizing: border-box;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.card {
  background: white;
  padding: 12px;
  display: grid;
  gap: 8px;
}

.media {
  width: 100%;
  height: auto;
  display: block;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
</style>
