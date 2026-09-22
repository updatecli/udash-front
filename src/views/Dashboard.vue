<template>
  <v-container class="page-shell">
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      height="2"
      class="page-progress"
      aria-label="Loading"
    ></v-progress-linear>
    <PageTitle
      title="Dashboard"
      icon="mdi-view-dashboard"
    />
    <v-row>
      <v-col
        cols="12"
      >
        <PipelineSCMFilter
          :filter="filter"
          :show-repository-branch="false"
          @update-filter="updateFilter"
          @loaded="setFilterLoaded"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
      >
        <PipelineSCMSSummary
          v-if="isFilterLoaded"
          :filter="filter"
          @loaded="setSummaryLoaded"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SCMSDashboard from '../components/scm/_summary.vue';
import PageTitle from '../components/PageTitle.vue';

import PipelineSCMFilter from '../components/scm/_filter.vue';

export default {
  name: 'DashboardView',
  components: {
    PageTitle,
    PipelineSCMFilter,
    PipelineSCMSSummary: SCMSDashboard,
  },

  data: () => ({
    isLoading: true,
    isFilterLoaded: false,
    filter: {},
  }),
  watch: {
    isLoading: function (val) {
      clearTimeout(this.loadingTimer)
      if (val) {
        this.loadingTimer = setTimeout(() => {
          this.isLoading = false
        }, 10000)
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this.loadingTimer)
  },
  methods: {
    updateFilter: function(newFilter) {
      this.filter = newFilter
    },
    setFilterLoaded: function(val) {
      this.isFilterLoaded = val
      if (!val) this.isLoading = true
    },
    setSummaryLoaded: function(val) {
      this.isLoading = !val
    },
  }
}
</script>

