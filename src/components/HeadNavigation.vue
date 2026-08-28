<template>
  <v-app-bar density="comfortable" color="surface" border="b" flat>
    <v-app-bar-title>Udash</v-app-bar-title>

    <template v-slot:append>
      <v-btn v-if="!isAuthenticated && !isLoading && isAuthEnabled" variant="tonal" @click.prevent="login">
        Login
      </v-btn>

      <v-menu v-if="isAuthenticated && isAuthEnabled">
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-account" aria-label="Account menu" v-bind="props"></v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-avatar size="50" color="surface-variant" class="d-block mx-auto">
              <v-img v-if="user?.picture" :src="user.picture" alt="User's profile picture" cover></v-img>
              <v-icon v-else icon="mdi-account"></v-icon>
            </v-avatar>
          </v-list-item>
          <v-list-item prepend-icon="mdi-account" title="Profile" to="/profile" value="profile"></v-list-item>
          <v-list-item prepend-icon="mdi-key" title="Tokens" to="/profile/tokens" value="tokens"></v-list-item>
          <v-list-item prepend-icon="mdi-logout" title="Logout" value="logout" @click.prevent="logout"></v-list-item>
        </v-list>
      </v-menu>
      <ThemeSwitcher />
    </template>
  </v-app-bar>
</template>

<script>
import { useRoute } from 'vue-router';
import { useAuth } from '@/composables/auth';
import { isAuthEnabled } from '@/composables/runtime';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';

export default {
  name: 'HeadNavigation',
  components: {
    ThemeSwitcher,
  },
  setup() {
    // With auth disabled neither the login button nor the account menu renders,
    // so there is no auth state for the template to read.
    if (!isAuthEnabled) {
      return { isAuthEnabled };
    }

    const auth = useAuth();
    const route = useRoute();

    return {
      isAuthEnabled,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      user: auth.user,
      // Carry the current route through the identity provider round trip so the
      // user lands back where they were; main.js replays it via consumeReturnTo().
      async login() {
        try {
          await auth.login(route.fullPath);
        } catch (err) {
          console.error('Login redirect failed', err);
        }
      },
      async logout() {
        try {
          await auth.logout();
        } catch (err) {
          console.error('Logout redirect failed', err);
        }
      },
    };
  },
}
</script>
