<template>

    <v-navigation-drawer
        v-model="drawer"
        color="background"
        expand-on-hover
        permanent
        rail
        bottom
        app>
  
        <v-list-item
          height="48"
          :prepend-avatar="getUpdatecliLogo"
          title="Menu"
          nav
          class="ml-2"
        ></v-list-item>
  
        <v-divider></v-divider>
  
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-home-city"
            title="Home"
            to="/"
            value="home"></v-list-item>
          <!-- Data pages, so they follow canReadData rather than the session: an open or
               public instance shows them to anonymous visitors, a private one does not. -->
          <v-list-item
            v-if="canReadData"
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/scm/dashboard"
            value="scmDashboard"></v-list-item>
          <v-list-item
            prepend-icon="mdi-book-open-variant"
            v-if="canReadData"
            title="Reports"
            to="/pipeline/reports"
            value="reports"></v-list-item>
          <!-- Public route, so the link is shown to anonymous visitors too: it is the
               only path to the project's licence and attribution details. -->
          <v-list-item
            prepend-icon="mdi-information"
            title="About"
            to="/about"
            value="about"></v-list-item>
        </v-list>
  
      </v-navigation-drawer>
</template>

<script>
    import { useAuth } from '@/composables/auth';
    import { getAppBaseUrl } from '@/composables/runtime';

    export default {
        name: 'SideNavigation',
        // main.js settles the auth state before mounting in every mode, so useAuth() is
        // safe to call unconditionally and canReadData already answers for an open
        // instance without this component special-casing one.
        setup() {
          const auth = useAuth();

          return {
            canReadData: auth.canReadData,
            isLoading: auth.isLoading,
          }
        },

        computed: {
          getUpdatecliLogo() {
            const baseUrl = getAppBaseUrl().replace(/\/+$/, '');
            return baseUrl + '/updatecli.png';
          }
        },
        data: () => ({
            drawer: true,
        }),
    }
</script>
