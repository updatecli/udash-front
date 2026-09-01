<template>
  <v-app-bar density="comfortable" color="surface" border="b" flat>
    <v-app-bar-title>Udash</v-app-bar-title>

    <template v-slot:append>
      <ThemeSwitcher />
      <!-- Same icon-button footprint as the account menu below, so the app bar's
           right edge does not jump when the auth state resolves. -->
      <v-btn
        v-if="!isAuthenticated && isAuthEnabled"
        icon
        aria-label="Log in"
        :loading="isLoading"
        :disabled="isLoading"
        @click.prevent="login"
      >
        <v-icon icon="mdi-login-variant"></v-icon>
        <v-tooltip activator="parent" text="Log in"></v-tooltip>
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
    // Both the login button and the account menu are gated on isAuthEnabled, so with
    // auth disabled neither renders whatever the auth state says. main.js settles that
    // state before mounting in every mode, so useAuth() is safe to call here regardless.
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
