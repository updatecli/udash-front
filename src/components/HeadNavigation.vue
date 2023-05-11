<template>
    <v-system-bar window app>

      <v-spacer></v-spacer>
      <v-btn
        v-if="!isAuthenticated && !isLoading"
        density="compact"
        variant="flat"
        @click.prevent="login"
      >
        Login
      </v-btn>

      <v-menu
        class="text-center"
        v-if="isAuthenticated"
      >
        <template v-slot:activator="{ props }">
          <v-btn density="compact" icon="mdi-account" v-bind="props"></v-btn>
        </template>
        <v-list>
          <v-list-item>
            <img
              :src="user.picture"
              alt="User's profile picture"
              class="nav-user-profile rounded-circle"
              width="50"
            />
          </v-list-item>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
            to="/profile"
            value="profile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
            @click.prevent="logout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-system-bar>
</template>

<script>
    import { useAuth0 } from '@auth0/auth0-vue';

    export default {
      name: 'HeadNavigation',
      setup() {
        const auth0 = useAuth0();

        return {
          isAuthenticated: auth0.isAuthenticated,
          isLoading: auth0.isLoading,
          user: auth0.user,
          login() {
            auth0.loginWithRedirect();
          },
          logout() {
            auth0.logout({
              logoutParams: {
                returnTo: window.location.origin
              }
            });
          }
        }
      },
      data: () => ({
      }),
    }
</script>
