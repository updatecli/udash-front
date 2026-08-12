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
