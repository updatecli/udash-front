<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container>
        <v-row>
          <v-col
            class="text-left"
            cols="auto"
            lg="12"
            md="12"
            sm="12"
          >
            <v-card
              class="mx-auto text-center"
              max-width="344"
              flat
            >
              <img
                :src="user?.picture"
                alt="User's profile picture"
                class="rounded-circle img-fluid profile-picture"
              />

              <v-card-title>
                  Profile
              </v-card-title>
              <v-card-text>
                <v-text-field
                  label="Name"
                  :model-value=user?.name
                  readonly
                  variant="outlined"
                ></v-text-field>
                <v-text-field
                  label="Email"
                  :model-value=user?.email
                  readonly
                  variant="outlined"
                ></v-text-field>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            class="text-right"
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
            <highlightjs language="json" :code="JSON.stringify(user, null, 2)" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <ReleaseFooter/>

  </v-app>
</template>

<script>
  import { useAuth0 } from '@auth0/auth0-vue';
  
  import ReleaseFooter from '../components/ReleaseFooter.vue';
  import SideNavigation from '../components/SideNavigation.vue';
  import HeadNavigation from '../components/HeadNavigation.vue';
  
  export default {
    name: "ProfileView",
    components: {
      ReleaseFooter,
      SideNavigation,
      HeadNavigation,
    },
    setup() {
      const auth0 = useAuth0();
      
      return {
        user: auth0.user,
      }
    }
  };
</script>