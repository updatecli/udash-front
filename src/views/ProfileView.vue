<template>
  <v-container class="page-shell">
    <PageTitle
      title="Profile"
      icon="mdi-account"
    />
    <v-row>
      <v-col cols="12">
        <!-- The userinfo fetch is intentionally non-fatal, so without this a failure
             would be indistinguishable from a user who simply has no details set. -->
        <v-alert
          v-if="error"
          type="warning"
          variant="tonal"
          density="compact"
          class="mx-auto mb-4"
          max-width="344"
        >
          Could not load profile details: {{ error.message }}
        </v-alert>

        <v-card
          class="mx-auto text-center"
          max-width="344"
          flat
        >
          <v-avatar size="120" color="surface-variant" class="mt-6">
            <v-img v-if="user?.picture" :src="user.picture" alt="User's profile picture" cover></v-img>
            <v-icon v-else icon="mdi-account" size="64"></v-icon>
          </v-avatar>

          <!-- The card used to be titled "Profile"; the page heading now says that, so
               repeating it here would label the card with its own page name. -->
          <v-card-text class="pt-6">
            <v-text-field
              label="Username"
              :model-value="user?.preferred_username"
              readonly
              variant="outlined"
            ></v-text-field>
            <v-text-field
              label="Name"
              :model-value="user?.name"
              readonly
              variant="outlined"
            ></v-text-field>
            <v-text-field
              label="Email"
              :model-value="user?.email"
              readonly
              variant="outlined"
            ></v-text-field>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import { useAuth } from '@/composables/auth';
  import PageTitle from '@/components/PageTitle.vue';

  export default {
    name: "ProfileView",
    components: {
      PageTitle,
    },
    setup() {
      const auth = useAuth();

      return {
        user: auth.user,
        error: auth.error,
      }
    }
  };
</script>
