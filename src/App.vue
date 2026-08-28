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
  padding: 2rem 1.5rem;
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
