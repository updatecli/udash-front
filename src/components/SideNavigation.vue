<template>

    <v-navigation-drawer
        v-model="drawer"
        expand-on-hover
        permanent
        rail
        bottom
        app>
  
        <v-list-item
          height="48"
          prepend-avatar="/updatecli.png"
          title="Menu"
          nav
        ></v-list-item>
  
        <v-divider></v-divider>
  
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-home-city"
            title="Home"
            to="/"
            value="home"></v-list-item>
          <v-list-item
            prepend-icon="mdi-satellite-variant"
            v-if="isAuthenticated"
            title="Reports"
            to="/pipeline/reports"
            value="reports"></v-list-item>
          <v-list-item
            prepend-icon="mdi-book-open-variant"
            v-if="isAuthenticated"
            title="Quickstart"
            to="/quickstart"
            value="quickstart"></v-list-item>
          <v-list-item
            prepend-icon="mdi-alien"
            v-if="isAuthenticated"
            title="About"
            to="/about"
            value="about"></v-list-item>
        </v-list>
  
      </v-navigation-drawer>
</template>

<script>
    import { useAuth0 } from '@auth0/auth0-vue';
    export default {
        name: 'SideNavigation',
        setup() {

          const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

          if (isAuthEnabled) {
            const auth0 = useAuth0();
            return {
              isAuthenticated: auth0.isAuthenticated,
              isLoading: auth0.isLoading,
            }
          }

          return {
            isAuthenticated: true,
            isLoading: false,
          }

        },
        data: () => ({
            drawer: true,
        }),
    }
</script>

