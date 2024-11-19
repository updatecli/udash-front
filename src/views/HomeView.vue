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
            Udash is a new type of monitoring platform.<br/>
            It brings flexibility by leveraging Updatecli Reports.<br/>
            By using a declarative dependency management tool such as Updatecli, <br/>
            we can compare versions used within a project with the latest one published upstream.<br/>
            We can monitor file contents, Docker image tags, maven artifacts, and many more.
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
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
            <PipelineSCMSSummary/>
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
import PipelineSCMSSummary from '../components/scm/_summary.vue';

export default {
  name: 'HomeView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineSCMSSummary,
  },
  data: () => ({
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
  ]
  })
}
</script>
