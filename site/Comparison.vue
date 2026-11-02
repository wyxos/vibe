<script setup lang="ts">
const demos = [
  { id: 'v1', name: 'V1 Current' },
  { id: 'v2', name: 'V2 Experimental' },
] as const
</script>

<template>
  <main class="comparison-page" aria-label="Vibe demo comparison">
    <header class="comparison-header">
      <div class="comparison-intro">
        <h1>Vibe comparison</h1>
        <p>Side-by-side view runs both feeds; compare performance individually.</p>
      </div>
      <nav class="comparison-links" aria-label="Open an individual demo">
        <a v-for="demo in demos" :key="demo.id" :href="`?demo=${demo.id}`" target="_blank" rel="noopener noreferrer">
          Open {{ demo.id.toUpperCase() }} full width
        </a>
      </nav>
    </header>
    <div class="comparison-panels">
      <section v-for="demo in demos" :key="demo.id" class="comparison-panel" :aria-labelledby="`comparison-${demo.id}`">
        <header class="comparison-panel-header">
          <h2 :id="`comparison-${demo.id}`">{{ demo.name }}</h2>
        </header>
        <iframe :src="`?demo=${demo.id}&embedded=1`" :title="`${demo.name} demo`" />
      </section>
    </div>
  </main>
</template>
