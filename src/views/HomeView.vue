<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container>
        <v-row>
          <v-col
            class="text-right"
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
          <h1>
            Update Monitor
          </h1>
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
            <p>
            Updatemonitor is a new type of release monitoring platform.
            </p>
            <p>
            It brings more flexibility by leveraging Updatecli's Sources.
            </p>
            <p>
            By using a declarative dependency management tool such as Updatecli, we can compare versions used within a project with the latest one published upstream.
            </p>
            <p>
            That being said, when we say "release monitoring platform", it's not true because Updatecli sources allow us to monitor more than releases.
            </p>
            <p>
            We can monitor docker image tags, maven artifacts published, the content of JSON/CSV/TOML/YAML files, etc.
            </p>
            <p>
            Stay tune, more to come...
            </p>
          </v-col>
            <!--
          <v-col
            cols="auto"
            lg="4"
            md="4"
            sm="12"
            >
            <v-img
              src="../assets/logo.png"
              cover
              class="grey darken-4"
            ></v-img>

          </v-col>
            -->
          <v-col
            cols="auto"
            lg="4"
            md="4"
            sm="12"
            >
            <div
              v-for="link in links"
              :key="link.name"
              >
              <v-btn
                class="mx-4"
                variant="text"
                :prepend-icon="link.icon"
                :href="link.to">
                {{ link.name }}
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'

import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';

export default {
  name: 'HomeView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
  },
  data: () => ({
    links:[
      {
      name: "Dashboards",
      to: "/dashboards",
      icon: "mdi-arrow-right-circle",
      },
      {
      name: "Updatecli",
      to: "https://www.updatecli.io",
      icon: "mdi-arrow-right-circle",
      },
      {
      name: "Backend",
      to: "https://github.com/updatecli/updatemonitor",
      icon: "mdi-github",
      },
      {
      name: "Frontend",
      to: "https://github.com/updatecli/app-dashboard",
      icon: "mdi-github",
      },

  ]
  })
}
</script>
