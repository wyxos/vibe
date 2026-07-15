<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const infiniteScroll = ref(true)
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-navigation">
        <RouterLink class="app-title" to="/">Vibe</RouterLink>
        <nav class="app-navigation" aria-label="Primary navigation">
          <RouterLink class="app-nav-link" to="/demos">Demos</RouterLink>
        </nav>
      </div>

      <label class="toggle-control">
        <span>Infinite scroll</span>
        <input
          v-model="infiniteScroll"
          data-test="infinite-scroll-toggle"
          class="toggle-input"
          type="checkbox"
        >
        <span class="toggle-track" aria-hidden="true">
          <span class="toggle-thumb" />
        </span>
      </label>
    </header>

    <RouterView v-slot="{ Component }">
      <component
        :is="Component"
        :infinite-scroll="infiniteScroll"
      />
    </RouterView>
  </div>
</template>
