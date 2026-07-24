<template>
    <v-system-bar color="background" window app>

      <v-spacer></v-spacer>
      <v-btn
        v-if="!isAuthenticated && !isLoading && isAuthEnabled"
        density="compact"
        variant="flat"
        @click.prevent="login"
      >
        Login
      </v-btn>

      <v-menu
        class="text-center"
        v-if="isAuthenticated && isAuthEnabled"
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
      <v-spacer></v-spacer>
      <ThemeSwitcher/>
    </v-system-bar>
</template>

<script>
    import { useAuth } from '@/composables/auth';
    import { isAuthEnabled } from '@/composables/runtime';
    import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

    export default {
      name: 'HeadNavigation',
      components: {
        ThemeSwitcher: ThemeSwitcher,
      },
      setup() {
        if (isAuthEnabled) {
          const auth = useAuth();

          return {
            isAuthEnabled: isAuthEnabled,
            isAuthenticated: auth.isAuthenticated,
            isLoading: auth.isLoading,
            user: auth.user,
            login() {
              auth.login();
            },
            logout() {
              auth.logout();
            }
          }
        }

        return {
          isAuthEnabled: isAuthEnabled,
          isAuthenticated: true,
          isLoading: false,
          user: {
            picture: 'https://cdn.vuetifyjs.com/images'
          },
        }

      },
      data: () => ({
      }),
    }
</script>
