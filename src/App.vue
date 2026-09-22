<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <router-view/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<style>
/* Every page's outermost container, so all page titles start at the same x and y.
   The .v-container prefix outranks Vuetify's own .v-container padding and per-breakpoint
   max-width, whichever stylesheet loads first. */
:root {
  --udash-font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
}

/* Versions, digests, identifiers and times: aligned digits and a face that tells
   0 from O, so values are easy to compare. */
.text-mono {
  font-family: var(--udash-font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.9em;
}

/* The product name where it stands as a logo: the app bar and the Home hero. Prose
   mentions of Udash keep the body face. */
.udash-wordmark {
  font-family: 'Orbitron', 'Space Grotesk', sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.v-container.page-shell {
  max-width: 1400px;
  padding: 1.5rem 1rem;
}

@media (min-width: 600px) {
  .v-container.page-shell {
    padding: 2rem 1.5rem;
  }
}

/* Loading bar pinned under the app bar, so waiting never covers the page. */
.page-progress {
  position: fixed !important;
  top: var(--v-layout-top, 0);
  left: 0;
  right: 0;
  z-index: 1005;
}

/* Label/value pairs that wrap into as many columns as fit, from one on a phone. */
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1rem 2rem;
  margin: 0;
}

.meta-grid dt {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.meta-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
}

/* Small icon buttons are fine for a mouse but too small for a finger. */
@media (pointer: coarse) {
  .v-btn.v-btn--icon.v-btn--size-x-small,
  .v-btn.v-btn--icon.v-btn--size-small {
    width: 44px;
    height: 44px;
  }
}
</style>

<script>
import ReleaseFooter from './components/ReleaseFooter.vue';
import SideNavigation from './components/SideNavigation.vue';
import HeadNavigation from './components/HeadNavigation.vue';

export default {
  name: 'App',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
  },
}
</script>
