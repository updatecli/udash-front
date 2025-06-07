<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <PipelineConfig/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../../components/ReleaseFooter.vue';
import SideNavigation from '../../components/SideNavigation.vue';
import HeadNavigation from '../../components/HeadNavigation.vue';
import PipelineConfig from '../../components/pipeline/configs/config.vue';

export default {
  name: 'PipelineConfigView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineConfig,
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
