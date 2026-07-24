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
          <v-list-item
            v-if="isAuthenticated"
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/scm/dashboard"
            value="scmDashboard"></v-list-item>
          <v-list-item
            prepend-icon="mdi-book-open-variant"
            v-if="isAuthenticated"
            title="Reports"
            to="/pipeline/reports"
            value="reports"></v-list-item>
          <v-list-item
            prepend-icon="mdi-information"
            v-if="isAuthenticated"
            title="About"
            to="/about"
            value="about"></v-list-item>
        </v-list>
  
      </v-navigation-drawer>
</template>

<script>
    import { useAuth } from '@/composables/auth';
    import { isAuthEnabled } from '@/composables/runtime';
    import { getAppBaseUrl } from '@/composables/runtime';

    export default {
        name: 'SideNavigation',
        setup() {
          if (isAuthEnabled) {
            const auth = useAuth();
            return {
              isAuthenticated: auth.isAuthenticated,
              isLoading: auth.isLoading,
            }
          }

          return {
            isAuthenticated: true,
            isLoading: false,
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
