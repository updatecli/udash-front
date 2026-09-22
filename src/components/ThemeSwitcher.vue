<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn icon="mdi-theme-light-dark" aria-label="Change theme" v-bind="props" />
    </template>

    <v-list>
      <v-list-item title="Light" prepend-icon="mdi-weather-sunny" @click="setTheme('light')" />
      <v-list-item title="Dark" prepend-icon="mdi-weather-night" @click="setTheme('dark')" />
      <v-list-item title="System" prepend-icon="mdi-monitor" @click="setTheme('system')" />
    </v-list>
  </v-menu>
</template>

<script setup>

import { onBeforeUnmount, ref, watch } from 'vue'
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

// In 'system' mode the OS preference is only read when applyTheme runs. The app shell
// in App.vue mounts once, so without this listener the theme would stay at whatever
// the OS was set to when the component mounted.
function onSystemThemeChange() {
  if (mode.value === 'system') {
    applyTheme('system')
  }
}

systemDark.addEventListener('change', onSystemThemeChange)

onBeforeUnmount(() => {
  systemDark.removeEventListener('change', onSystemThemeChange)
})

</script>
