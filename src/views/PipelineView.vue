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
            Pipeline
          </h1>
          </v-col>
        </v-row>
      </v-container>
      <PipelineDashboard/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';
import PipelineDashboard from '../components/PipelineDashboard.vue';

export default {
  name: 'PipelineView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineDashboard,
  },
  data: () => ({
    links:[
      {
      name: "Updatecli",
      to: "https://www.updatecli.io",
      icon: "mdi-arrow-right-circle",
      },
  ]
  })
}
</script>
