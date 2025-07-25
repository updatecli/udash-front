<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-container
        class="py-8 px-6"
        fluid
      >
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
            <h1>SCM <v-icon icon="mdi-satellite-variant"> </v-icon></h1>
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
import SCMSDashboard from '../components/scm/_summary.vue';

export default {
  name: 'QuickStartView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineSCMSSummary: SCMSDashboard,
  },

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  data: () => ({
    isLoading: true,
    host: window.location.protocol + "//" + window.location.host,
    externalLinks:[
      {
        name: "Updatecli",
        to: "https://www.updatecli.io",
        icon: "mdi-web",
      },
      {
        name: "GitHub",
        to: "https://github.com/updatecli/updatecli",
        icon: "mdi-github",
      },
    ],
    links:[
      {
        name: "Reports",
        to: "/pipeline/reports",
        icon: "mdi-satellite-variant",
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

