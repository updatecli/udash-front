<template>
  <!-- Every page announces itself through this component so the heading level, size and
       spacing stay in one place. Two tiers only: `hero` for the landing pages (Home,
       About), the compact bar for everything that is a tool rather than an entrance. -->
  <header :class="hero ? 'mb-8' : 'mb-6'">
    <template v-if="hero">
      <h1 class="text-display-small font-weight-bold mb-4">{{ title }}</h1>
      <p v-if="hasSubtitle" class="text-body-large text-medium-emphasis mb-0">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </template>

    <template v-else>
      <div class="d-flex align-center flex-wrap ga-4 mb-2">
        <h1 class="text-headline-small font-weight-bold d-flex align-center">
          <v-icon v-if="icon" :icon="icon" class="mr-2"></v-icon>
          {{ title }}
          <v-tooltip v-if="tooltip" location="right">
            <template v-slot:activator="{ props }">
              <v-icon
                icon="mdi-information-outline"
                size="small"
                class="ml-2"
                v-bind="props"
              ></v-icon>
            </template>
            <span>{{ tooltip }}</span>
          </v-tooltip>
        </h1>

        <v-spacer></v-spacer>
        <slot name="actions"></slot>
      </div>

      <p v-if="hasSubtitle" class="text-body-small text-medium-emphasis mb-0">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </template>
  </header>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  tooltip: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  hero: { type: Boolean, default: false },
})

const slots = useSlots()

// The subtitle can arrive either as a plain prop or as a slot, so the paragraph must not
// be rendered (and its margin reserved) when neither is supplied.
const hasSubtitle = computed(() => Boolean(props.subtitle) || Boolean(slots.subtitle))
</script>
