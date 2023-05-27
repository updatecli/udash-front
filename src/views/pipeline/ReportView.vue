<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <PipelineReport/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../../components/ReleaseFooter.vue';
import SideNavigation from '../../components/SideNavigation.vue';
import HeadNavigation from '../../components/HeadNavigation.vue';
import PipelineReport from '../../components/pipeline/report.vue';

export default {
  name: 'PipelineReportView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineReport: PipelineReport,
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
