<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
  }>(),
  {
    title: 'Vibe',
    subtitle: 'Ready for a fresh build.',
  },
)
</script>

<template>
  <section class="vibe-root">
    <p class="vibe-root__eyebrow">Library component</p>
    <h2 class="vibe-root__title">{{ title }}</h2>
    <p class="vibe-root__subtitle">{{ subtitle }}</p>

    <div class="vibe-root__body">
      <slot>
        Replace this placeholder with the real Vibe surface.
      </slot>
    </div>
  </section>
</template>

<style scoped>
.vibe-root {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.72);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 247, 237, 0.84)),
    rgba(255, 255, 255, 0.82);
  color: #1f1a16;
  box-shadow: 0 30px 80px -48px rgba(31, 26, 22, 0.45);
}

.vibe-root__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #78716c;
}

.vibe-root__title {
  margin: 0;
  font-size: clamp(1.85rem, 4vw, 2.6rem);
  line-height: 1.02;
}

.vibe-root__subtitle {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: #57534e;
}

.vibe-root__body {
  display: grid;
  gap: 1rem;
  margin-top: 0.5rem;
}
</style>
