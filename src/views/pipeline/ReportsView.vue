<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-overlay
        :model-value="isLoading"
        class="align-center justify-center"
        :disabled=true
        :eager=true
        :no-click-animation=true
        :persistent=true
        :opacity="0"
      >
        <v-progress-circular
          color="black"
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
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
            Reports <v-icon icon="mdi-book-open-variant"></v-icon>
          </h1>
          </v-col>
        </v-row>
      </v-container>
      <PipelineSCMFilter
        :scmid="scmid"
        @update-scmid="updateSCMID"
        @loaded="setFilterLoaded"
      />
      <PipelineSCMSummary
        v-if="isFilterLoaded"
        :hideButton=false
        :scmid="scmid"
        @update-scmid="updateSCMID"
        @loaded="setSummaryLoaded"
        class="align-center justify-center"
      />
      <PipelineReports
        v-if="isFilterLoaded"
        :scmid="scmid"
        @update-scmid="updateSCMID"
        @loaded="setReportsLoaded"
      />
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
  beforeUnmount() {
    this.cancelAutoUpdate();
  },
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
    isFilterLoaded: false,
    isSummaryLoaded: false,
    isReportsLoaded: false,
    isLoading: true,
    scmid: "",
  }),

  watch: {
    isFilterLoaded: function() {
      this.isLoading = !this.isAllComponentsLoaded()
    },
    isSummaryLoaded: function() {
      this.isLoading = !this.isAllComponentsLoaded()
    },
    isReportsLoaded: function() {
      this.isLoading = !this.isAllComponentsLoaded()
    },
    isLoading: function (val) {
      val && setTimeout(() => {
        this.isLoading = false
      }, 10000)
    },
    scmid: function() {
      // IF the scmid is changed, we need to wait for the summary and reports to be updated
      this.setSummaryLoaded(false)
      this.setReportsLoaded(false)
    }
  },

  methods: {
    cancelAutoUpdate: function() {
      clearInterval(this.timer);
    },
    setFilterLoaded: function(state) {
      this.isFilterLoaded = state;
      this.isSummaryLoaded = false;
      this.isReportsLoaded = false;
    },
    setSummaryLoaded: function(state) {
      this.isSummaryLoaded = state;
    },
    setReportsLoaded: function(state) {
      this.isReportsLoaded = state;
    },
    updateSCMID: function(scmid) {
      this.scmid = scmid;
    },
    isAllComponentsLoaded: function() {
      if (this.isFilterLoaded && this.isSummaryLoaded && this.isReportsLoaded) {
        return true
      }
      return false
    },
  }
}
</script>
