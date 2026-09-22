<template>
  <v-app-bar density="comfortable" color="surface" border="b" flat>
    <template v-if="smAndDown" v-slot:prepend>
      <v-app-bar-nav-icon aria-label="Open navigation" @click="navDrawerOpen = !navDrawerOpen" />
    </template>

    <v-app-bar-title><span class="udash-wordmark">Udash</span></v-app-bar-title>

    <template v-slot:append>
      <LiveStatus />
      <ThemeSwitcher />
      <v-btn
        v-if="!isAuthenticated && isAuthEnabled"
        color="primary"
        variant="flat"
        class="mx-2"
        :loading="isLoading"
        :disabled="isLoading"
        @click.prevent="login"
      >
        Log in
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
          <v-list-item prepend-icon="mdi-key" title="API tokens" to="/profile/tokens" value="tokens"></v-list-item>
          <v-list-item prepend-icon="mdi-logout" title="Log out" value="logout" @click.prevent="logout"></v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script>
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { navDrawerOpen } from '@/composables/navigation';
import { useAuth } from '@/composables/auth';
import { isAuthEnabled } from '@/composables/runtime';
import ThemeSwitcher from '@/components/ThemeSwitcher.vue';
import LiveStatus from '@/components/LiveStatus.vue';

export default {
  name: 'HeadNavigation',
  components: {
    LiveStatus,
    ThemeSwitcher,
  },
  setup() {
    // Both the login button and the account menu depend on isAuthEnabled, so with
    // auth disabled neither renders, whatever the auth state says. main.js settles that
    // state before mounting in every mode, so useAuth() is safe to call here regardless.
    const auth = useAuth();
    const route = useRoute();
    const { smAndDown } = useDisplay();

    return {
      smAndDown,
      navDrawerOpen,
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

<style scoped>
.udash-wordmark {
  font-family: 'Orbitron', 'Space Grotesk', sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
