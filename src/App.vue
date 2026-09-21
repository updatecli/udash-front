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
/* Every page's outermost container. Views used to each pick their own width, fluidity
   and padding, so no two page titles started at the same x or y. The .v-container
   prefix is deliberate: it outranks Vuetify's own .v-container padding and per-breakpoint
   max-width regardless of which stylesheet loads first. */
.v-container.page-shell {
  max-width: 1400px;
  padding: 1.5rem 1rem;
}

@media (min-width: 600px) {
  .v-container.page-shell {
    padding: 2rem 1.5rem;
  }
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
