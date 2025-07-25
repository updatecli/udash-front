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
          <h1>Udash <v-icon icon="mdi-home-city"></v-icon></h1>
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
            Udash is an innovative monitoring platform designed to provide<br/>
            flexibility and insight into your project's dependencies.<br/>
            Powered by Updatecli, Udash enables a declarative approach to dependency monitoring.<br/>
            By integrating Updatecli’s capabilities, Udash helps streamline dependency updates,<br/>
            improve security by identifying outdated versions,
            and maintain consistency across your projects, all in a flexible, declarative framework.
            </p>
          </v-col>
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
                :to="link.to">
                {{ link.name }}
              </v-btn>
            </div>
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
          <h2>Report View </h2>

          <v-text-area>
            <p>
              The report "view" allows to visualize Updatecli pipeline report.
            </p>
            <p>
              Updatecli must be configured to publish reports after each pipeline execution.
            </p>

            <v-divider></v-divider>
              <v-card
                variant="flat"
              >
                <v-card-title>
                  <h3>Login</h3>
                </v-card-title>
                <v-card-text>
                  updatecli udash login "{{ host }}" --experimental
                </v-card-text>
              </v-card>

              <v-card
                variant="flat"
              >
                <v-card-title>
                  <h3>Publish</h3>
                </v-card-title>
                <v-card-text>
                  <br/>
                  updatecli diff --experimental ghcr.io/updatecli/policies/policies/autodiscovery/all:latest
                </v-card-text>
              </v-card>
            </v-text-area>

          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>
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
    isLoading: true,
    links:[
      {
        name: "QuickStart",
        to: "/quickstart",
        icon: "mdi-arrow-right-circle",
      },
      {
        name: "Reports",
        to: "/pipeline/reports",
        icon: "mdi-arrow-right-circle",
      },
      {
        name: "Configs",
        to: "/pipeline/configs",
        icon: "mdi-arrow-right-circle",
      },
  ]
  }),
}
</script>
