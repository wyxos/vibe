import { ref } from 'vue'

export const selectionRows = ref<{ imageId: number; postId: number }[]>([])
export const selectionBusy = ref(false)
export const selectionError = ref('')
export const selectionReady = ref(false)
let pendingAction: { postId: number; selected: boolean } | undefined

export async function retrySelection(): Promise<void> {
  await request(pendingAction)
}

export async function refreshSelections(): Promise<void> {
  await request()
}

export async function selectPost(postId: number, selected: boolean): Promise<void> {
  if (selectionBusy.value) return
  await request({ postId, selected })
}

async function request(action?: { postId: number; selected: boolean }): Promise<void> {
  pendingAction = action
  selectionBusy.value = true
  selectionError.value = ''
  try {
    const response = await fetch('/__selection', action ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    } : undefined)
    if (!response.ok) throw new Error('Selection unavailable')
    selectionRows.value = await response.json()
    selectionReady.value = true
    pendingAction = undefined
  } catch {
    selectionError.value = 'Could not read or save selections. Check the dev server and retry.'
  } finally {
    selectionBusy.value = false
  }
}
