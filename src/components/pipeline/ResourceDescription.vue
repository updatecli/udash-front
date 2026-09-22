<template>
  <div v-if="parts" class="resource-description">
    <p v-if="parts.before" class="text-body-large resource-description__text mb-2">{{ parts.before }}</p>
    <pre class="resource-description__payload"><code>{{ parts.payload }}</code></pre>
    <p v-if="parts.after.trim()" class="text-body-large resource-description__text mt-2 mb-0">{{ parts.after.trim() }}</p>
  </div>
  <p v-else class="text-body-large resource-description__text">{{ text || 'No description' }}</p>
</template>

<script setup>
import { computed } from 'vue'
import { splitDescription } from '@/composables/description'

const props = defineProps({
  text: { type: String, default: '' },
})

const parts = computed(() => splitDescription(props.text))
</script>

<style scoped>
.resource-description__text {
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.resource-description__payload {
  max-height: 300px;
  overflow: auto;
  margin: 0;
  padding: 12px;
  border-radius: 4px;
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  color: rgb(var(--v-theme-on-surface));
  font-family: var(--udash-font-mono);
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre;
}
</style>
