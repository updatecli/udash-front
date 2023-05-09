<template>
    <v-app>
      <HeadNavigation/>
      <SideNavigation/>
  
      <v-main>
        <ReleaseDashboard/>
      </v-main>

      <ReleaseFooter/>
    </v-app>
  
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view/>
  </template>
  
  <script>
  import ReleaseDashboard from '../components/ReleaseDashboard.vue';
  import ReleaseFooter from '../components/ReleaseFooter.vue';
  import SideNavigation from '../components/SideNavigation.vue';
  import HeadNavigation from '../components/HeadNavigation.vue';

  export default {
    name: 'DashboardView',
    components: {
      ReleaseDashboard,
      ReleaseFooter,
      SideNavigation,
      HeadNavigation,
    },
  }
  </script>
  