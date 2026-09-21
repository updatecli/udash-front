<template>
  <v-alert
    type="error"
    variant="tonal"
    :density="compact ? 'compact' : 'default'"
    :title="title"
    role="alert"
  >
    <p class="mb-3">{{ message }}</p>

    <v-btn
      variant="outlined"
      size="small"
      prepend-icon="mdi-refresh"
      :loading="retrying"
      @click="$emit('retry')"
    >
      Try again
    </v-btn>
  </v-alert>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  message: { type: String, required: true },
  retrying: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})

defineEmits(['retry'])
</script>
