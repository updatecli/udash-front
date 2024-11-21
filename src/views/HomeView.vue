<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container>
        <v-overlay
        :model-value="isLoading"
        class="align-center justify-center"
        :disabled=false
        :eager=true
        :no-click-animation=true
        :persistent=false
        :opacity="0"
        >
        <v-progress-circular
          color="black"
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
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
            cols="auto"
            lg="12"
            md="12"
            sm="12"
          >
            <PipelineSCMSSummary
              @loaded="setSummaryLoaded"
            />
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
  beforeUnmount() {
    this.cancelAutoUpdate();
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
  ]
  }),
  watch: {
    isLoading: function (val) {
      val && setTimeout(() => {
        this.isLoading = false
      }, 10000)
    }
  },
  methods: {
    cancelAutoUpdate: function() {
      clearInterval(this.timer);
    },
    setSummaryLoaded: function(val) {
      this.isLoading = !val
    },
  }
}
</script>
