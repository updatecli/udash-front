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
      title="Reports"
      icon="mdi-book-open-variant"
    />
    <v-row>
      <v-col
        cols="12"
      >

        <PipelineSCMFilter
          ref="scmFilter"
          :show-repository-branch="true"
          @update-filter="updateFilter"
          @loaded="setFilterLoaded"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
      >
        <!-- Add explanatory header -->
        <div class="mb-3">
          <h2 class="text-title-large d-flex align-center">
            Latest results
          </h2>
          <p class="text-body-small text-medium-emphasis mb-0">
            Result of the most recent run of each pipeline on this branch. Select a result to filter the reports below.
          </p>
        </div>

        <PipelineSCMSummary
          v-if="isFilterLoaded"
          :hideButton=true
          :filter="filter"
          :fullWidth=true
          :disableLinks=true
          :hideRepositoryTitle=true
          @update-filter="updateFilter"
          @toggle-result="toggleResult"
          @loaded="setSummaryLoaded"
          class="align-center justify-center"
        />
      </v-col>
    </v-row>
    <!-- The pull requests still open on what the filter selects, once each, whichever page
         of reports below they come from. -->
    <v-row v-if="isFilterLoaded && filter.openAction !== false">
      <v-col
        cols="12"
      >
        <PullRequestList
          :filter="filter"
          paginated
          :limit="5"
          heading-class="text-title-large"
          count-qualifier="in this period"
          empty="No pull request matches this filter."
        />
      </v-col>
    </v-row>
    <p
      v-else-if="isFilterLoaded"
      class="reports-note text-body-small text-medium-emphasis"
    >
      Pull requests are hidden while the filter keeps only pipelines without one.
    </p>
    <v-row>
      <v-col
        cols="12"
      >
        <!-- Add explanatory header for pipeline reports -->
        <div class="mb-3">
          <h2 class="text-title-large d-flex align-center">
            All reports
          </h2>
        </div>

        <PipelineReports
          v-if="isFilterLoaded"
          :filter="filter"
          @update-filter="updateFilter"
          @loaded="setReportsLoaded"
        />
      </v-col>
    </v-row>

  </v-container>
</template>

<script>

import PipelineReports from '../../components/pipeline/reports.vue';
import PageTitle from '../../components/PageTitle.vue';
import PullRequestList from '../../components/PullRequestList.vue';

import PipelineSCMSummary from '../../components/scm/_summary.vue';
import PipelineSCMFilter from '../../components/scm/_filter.vue';

export default {
  name: 'PipelineReportsView',
  beforeUnmount() {
    this.cancelAutoUpdate();
  },
  components: {
    PageTitle,
    PipelineReports,
    PullRequestList,
    PipelineSCMFilter,
    PipelineSCMSummary
  },
  data: () => ({
    isFilterLoaded: false,
    isSummaryLoaded: false,
    isReportsLoaded: false,
    isLoading: true,
    filter: {},
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
      clearTimeout(this.loadingTimer)
      if (val) {
        this.loadingTimer = setTimeout(() => {
          this.isLoading = false
        }, 10000)
      }
    },
    filter: function() {
      // If the filter is changed, we need to wait for the summary and reports to be updated
      this.setSummaryLoaded(false)
      this.setReportsLoaded(false)
    }
  },

  methods: {
    isFilterData : function() {
      return Object.keys(this.filter).length !== 0 && this.isFilterLoaded;
    },
    cancelAutoUpdate: function() {
      clearTimeout(this.loadingTimer);
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
    updateFilter: function(filter) {
      this.filter = filter;
    },
    // The summary doughnuts narrow the filter instead of filtering themselves. They keep
    // showing the whole breakdown of the branch while the reports below shrink to the
    // clicked result. The filter owns that state, so we pass the value to it instead of
    // keeping a second copy here.
    //
    // openAction is set only by the segments standing for one half of a result split on
    // whether a pull request is still open. Both dimensions are then handed over
    // together, so the reports below never show a half applied filter.
    toggleResult: function(result, openAction) {
      if (openAction === undefined) {
        this.$refs.scmFilter?.toggleResult(result);
        return;
      }

      this.$refs.scmFilter?.toggleResultWithOpenAction(result, openAction ? 'open' : 'none');
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

<style scoped>
.reports-note {
  margin: 0 0 8px;
}
</style>
