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
            Pipelines
          </h1>
          </v-col>
        </v-row>
      </v-container>
      <PipelinesTable/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../components/ReleaseFooter.vue';
import SideNavigation from '../components/SideNavigation.vue';
import HeadNavigation from '../components/HeadNavigation.vue';
import PipelinesTable from '../components/PipelinesTable.vue';

export default {
  name: 'PipelinesView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelinesTable,
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
