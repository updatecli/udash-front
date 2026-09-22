import { onBeforeUnmount, ref, watch } from 'vue'

// Live data for the views people keep open all day. Views that can refresh quietly
// subscribe with useLiveRefresh and report each successful load with markUpdated; the
// app bar reads lastUpdated to say how fresh the page is. A view that does not refresh
// never calls markUpdated, so the app bar shows nothing rather than a stale promise.

const REFRESH_INTERVAL_MS = 60 * 1000

export const lastUpdated = ref(null)
export const now = ref(Date.now())

const refreshTick = ref(0)
let timersStarted = false

function startTimers() {
  if (timersStarted) {
    return
  }
  timersStarted = true

  setInterval(() => {
    now.value = Date.now()
  }, 1000)

  // Hidden tabs do not refresh; coming back to a stale one refreshes it at once.
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      refreshTick.value += 1
    }
  }, REFRESH_INTERVAL_MS)

  document.addEventListener('visibilitychange', () => {
    const stale = lastUpdated.value !== null && Date.now() - lastUpdated.value > REFRESH_INTERVAL_MS
    if (document.visibilityState === 'visible' && stale) {
      refreshTick.value += 1
    }
  })
}

export function markUpdated() {
  lastUpdated.value = Date.now()
}

export function clearUpdated() {
  lastUpdated.value = null
}

export function refreshNow() {
  refreshTick.value += 1
}

// subscribeRefresh calls refresh on every tick until the returned function is called.
// Options API components call it in mounted and stop it in beforeUnmount.
export function subscribeRefresh(refresh) {
  startTimers()
  return watch(refreshTick, () => refresh())
}

// useLiveRefresh is subscribeRefresh for components using setup.
export function useLiveRefresh(refresh) {
  onBeforeUnmount(subscribeRefresh(refresh))
}

export function useNow() {
  startTimers()
  return now
}
