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
            Reports <v-icon icon="mdi-satellite-variant"></v-icon>
          </h1>
          </v-col>
        </v-row>
      </v-container>
      <PipelineSCMFilter :scmid="scmid" @update-scmid="updateSCMID"/>
      <PipelineSCMSummary
        :hideButton=true
        :expanded-summary="[0]"
        :scmid="scmid"
        @update-scmid="updateSCMID"
        class="align-center justify-center"
      />
      <PipelineReports :scmid="scmid" @update-scmid="updateSCMID"/>
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../../components/ReleaseFooter.vue';
import SideNavigation from '../../components/SideNavigation.vue';
import HeadNavigation from '../../components/HeadNavigation.vue';
import PipelineReports from '../../components/pipeline/reports.vue';

import PipelineSCMSummary from '../../components/scm/_summary.vue';
import PipelineSCMFilter from '../../components/scm/_filter.vue';

export default {
  name: 'PipelineReportsView',
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineReports,
    PipelineSCMFilter,
    PipelineSCMSummary
  },
  data: () => ({
    links:[
      {
      name: "Updatecli",
      to: "https://www.updatecli.io",
      icon: "mdi-arrow-right-circle",
      },
  ],
    scmid: "",
  }),

  methods: {
    updateSCMID(scmid) {
      this.scmid = scmid;
    },
  }
}
</script>
