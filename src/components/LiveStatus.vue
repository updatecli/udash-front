<template>
  <!-- How fresh the page is, and a way to refresh it now. Only shown on views that
       refresh themselves; the others never report an update. -->
  <v-btn
    v-if="lastUpdated !== null"
    variant="text"
    size="small"
    class="live-status"
    :aria-label="`Refresh now. Last updated ${label}.`"
    @click="refreshNow"
  >
    <span class="live-status__dot" :class="{ 'live-status__dot--fresh': isFresh }" aria-hidden="true"></span>
    <span class="live-status__text text-medium-emphasis d-none d-sm-inline">Updated <span class="text-mono">{{ label }}</span></span>
  </v-btn>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { lastUpdated, refreshNow, clearUpdated, useNow } from '@/composables/live'

const now = useNow()
const route = useRoute()

// A new page shows no update time until its own data arrives.
watch(() => route.path, () => clearUpdated())

const seconds = computed(() => Math.max(0, Math.floor((now.value - (lastUpdated.value || now.value)) / 1000)))

const label = computed(() => {
  if (seconds.value < 5) return 'just now'
  if (seconds.value < 60) return `${seconds.value}s ago`
  const minutes = Math.floor(seconds.value / 60)
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`
})

const isFresh = computed(() => seconds.value < 3)
</script>

<style scoped>
.live-status {
  text-transform: none;
  letter-spacing: normal;
}

.live-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}

.live-status__text {
  margin-left: 8px;
}

/* One ring when data arrives: the motion reports that something changed. */
.live-status__dot--fresh {
  animation: live-pulse 1.2s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes live-pulse {
  from {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.6);
  }
  to {
    box-shadow: 0 0 0 8px rgba(var(--v-theme-primary), 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-status__dot--fresh {
    animation: none;
  }
}
</style>
