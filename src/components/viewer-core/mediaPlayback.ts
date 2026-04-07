export function playMediaElement(media: HTMLMediaElement) {
  try {
    const playResult = media.play()

    if (playResult && typeof playResult.catch === 'function') {
      void playResult.catch(() => {})
    }
  }
  catch {
    // Ignore autoplay failures from browsers or test environments.
  }
}
