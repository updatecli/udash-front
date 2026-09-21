<template>
  <!-- Shown wherever a request for data failed, in place of the data. An empty state in
       that position would claim there is nothing to show, which the reader cannot tell
       apart from a broken API; this says what failed and offers the one way forward.
       role="alert" announces it, since it usually replaces a spinner nobody is watching. -->
  <v-alert
    type="error"
    variant="tonal"
    :density="compact ? 'compact' : 'default'"
    :title="title"
    role="alert"
  >
    <p class="mb-0">{{ message }}</p>

    <template v-slot:append>
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-refresh"
        :loading="retrying"
        @click="$emit('retry')"
      >
        Try again
      </v-btn>
    </template>
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
