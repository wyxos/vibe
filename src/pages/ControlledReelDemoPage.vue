<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { VibeControlledReel, type VibeControlledReelRequest, type VibeControlledReelState } from '@/index'

const total = 3_000_000
const position = ref(1)
const revision = ref(0)
const hold = ref(false)
const decline = ref(false)
const fail = ref(false)
const requests = ref(0)
const error = ref('')
const pending = shallowRef<(() => void) | null>(null)
const reel = shallowRef<InstanceType<typeof VibeControlledReel> | null>(null)

function item(index: number) {
  const artwork = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="${index % 2 ? '#19364d' : '#303047'}"/><circle cx="450" cy="450" r="210" fill="#52749c"/><text x="450" y="790" fill="white" text-anchor="middle" font-family="sans-serif" font-size="54">Sample ${index + 1}</text></svg>`)}`
  return { id: index, artwork, label: `Sample ${index + 1}` }
}
const state = computed<VibeControlledReelState>(() => ({
  revision: revision.value,
  current: item(position.value),
  previous: position.value > 0 ? item(position.value - 1) : null,
  next: position.value < total - 1 ? item(position.value + 1) : null,
  canPrevious: position.value > 0, canNext: position.value < total - 1,
  position: position.value, total,
}))
async function navigate({ direction, signal }: VibeControlledReelRequest) {
  requests.value += 1
  error.value = ''
  if (hold.value) await new Promise<void>(resolve => {
    const complete = () => { signal.removeEventListener('abort', complete); pending.value = null; resolve() }
    pending.value = complete
    signal.addEventListener('abort', complete, { once: true })
  })
  if (signal.aborted || decline.value) return false
  if (fail.value) throw new Error('Synthetic navigation failure')
  position.value += direction === 'next' ? 1 : -1
  revision.value += 1
}
function reset(index: number) {
  revision.value += 1
  position.value = index
  error.value = ''
}
onBeforeUnmount(() => pending.value?.())
</script>

<template>
  <section class="controlled-reel-demo" aria-label="Controlled reel demo">
    <div class="controlled-reel-demo-toolbar">
      <p>Sample queue · {{ position + 1 }} of {{ total.toLocaleString() }} · Requests: {{ requests }}</p>
      <div class="controlled-reel-demo-actions">
        <button type="button" @click="reel?.navigate('previous')">Previous</button>
        <button type="button" @click="reel?.navigate('next')">Next</button>
        <button type="button" @click="reset(0)">First</button>
        <button type="button" @click="reset(total - 1)">Last</button>
        <button type="button" @click="reset(1)">Restart</button>
        <button type="button" :disabled="!pending" @click="pending?.()">Complete request</button>
        <label><input v-model="hold" type="checkbox"> Hold request</label>
        <label><input v-model="decline" type="checkbox"> Decline request</label>
        <label><input v-model="fail" type="checkbox"> Fail request</label>
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
    </div>
    <VibeControlledReel ref="reel" :state="state" :on-navigate="navigate" @navigation-error="error = 'Unable to change sample. Try again.'">
      <template #default="{ item: current, pending: waiting }">
        <div class="controlled-reel-demo-media" :data-host-id="current?.id">
          <img :src="current?.artwork" :alt="current?.label">
          <audio controls aria-label="One host-owned audio element" />
          <span v-if="waiting" role="status">Changing sample…</span>
        </div>
      </template>
    </VibeControlledReel>
  </section>
</template>
