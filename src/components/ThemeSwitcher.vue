<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        class="mt-5 mr-5"
        icon="mdi-theme-light-dark"
        v-bind="props"
        variant="flat"
        density="comfortable"
      />
    </template>

    <v-list>
      <v-list-item
        title="Light"
        prepend-icon="mdi-weather-sunny"
        @click="setTheme('light')"
      />
      <v-list-item
        title="Dark"
        prepend-icon="mdi-weather-night"
        @click="setTheme('dark')"
      />
      <v-list-item
        title="System"
        prepend-icon="mdi-monitor"
        @click="setTheme('system')"
      />
    </v-list>
  </v-menu>
</template>

<script setup>

import { ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { getStorageKey } from '@/composables/runtime';

const THEME_STORAGE_KEY = getStorageKey('theme');

const theme = useTheme()
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const savedMode = localStorage.getItem(THEME_STORAGE_KEY)

const mode = ref(
  savedMode === 'light' || savedMode === 'dark' || savedMode === 'system'
    ? savedMode
    : 'system'
)

function applyTheme(value) {
  if (value === 'system') {
    theme.change(systemDark.matches ? 'dark' : 'light')
  } else {
    theme.change(value)
  }
}

function setTheme(value) {
  mode.value = value
}

watch(mode, value => {
  applyTheme(value)
  localStorage.setItem(THEME_STORAGE_KEY, value)
}, {
  immediate: true,
})

</script>