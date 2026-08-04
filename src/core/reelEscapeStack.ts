export interface ReelEscapeParticipant {
  element: () => HTMLElement | null
  isActive: () => boolean
}

const participants: ReelEscapeParticipant[] = []

export function registerReelEscapeParticipant(
  participant: ReelEscapeParticipant,
): () => void {
  participants.push(participant)

  return () => {
    const index = participants.indexOf(participant)
    if (index >= 0) participants.splice(index, 1)
  }
}

export function isTopmostActiveReel(
  participant: ReelEscapeParticipant,
): boolean {
  if (!participant.isActive()) return false

  const active = participants.filter((candidate) => candidate.isActive())
  const element = participant.element()
  const hasActiveDescendant = element !== null && active.some((candidate) => {
    if (candidate === participant) return false
    const candidateElement = candidate.element()
    return candidateElement !== null && element.contains(candidateElement)
  })
  if (hasActiveDescendant) return false

  const topLevel = active.filter((candidate) => {
    const candidateElement = candidate.element()
    return candidateElement === null || !active.some((other) => {
      if (other === candidate) return false
      const otherElement = other.element()
      return otherElement !== null && candidateElement.contains(otherElement)
    })
  })

  return topLevel.at(-1) === participant
}
