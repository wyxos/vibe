<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <main>
    <h1>Vite + Vue</h1>
    <button type="button" @click="count++">count is {{ count }}</button>
  </main>
</template>

<style scoped>
main {
  display: grid;
  gap: 12px;
  padding: 24px;
}
</style>
