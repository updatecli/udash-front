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
      <v-container>
        <v-row>
          <v-col
            cols="auto"
            lg="12"
            md="12"
            sm="12"
          >
            <!-- Add explanatory header for filter -->
            <div class="mb-3">
              <h3 class="text-h6 d-flex align-items-center">
                Filter Reports
                <v-tooltip text="Search and filter pipeline reports by repository, branch, or status. Use the dropdown to select specific repositories or search by keywords.">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="small"
                      class="ml-2"
                      color="grey-darken-1"
                    >
                      mdi-information-outline
                    </v-icon>
                  </template>
                </v-tooltip>
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                Search repositories, branches, or filter by status
              </p>
            </div>

            <PipelineSCMFilter
              :filter="filter"
              @update-filter="updateFilter"
              @loaded="setFilterLoaded"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="auto"
            lg="3"
            md="3"
            sm="12"
          >
            <!-- Add explanatory header -->
            <div class="mb-3">
              <h3 class="text-h6 d-flex align-items-center">
                Latest Status Overview
                <v-tooltip text="Shows the status summary from the most recent pipeline reports for the current repository branch">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="small"
                      class="ml-2"
                      color="grey-darken-1"
                    >
                      mdi-information-outline
                    </v-icon>
                  </template>
                </v-tooltip>
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                Current status from latest pipeline runs
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
              @loaded="setSummaryLoaded"
              class="align-center justify-center"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="auto"
            lg="12"
            md="12"
            sm="12"
          >
            <!-- Add explanatory header for pipeline reports -->
            <div class="mb-3">
              <h3 class="text-h6 d-flex align-items-center">
                Detailed Reports
                <v-tooltip text="Complete list of pipeline reports with detailed information including timestamps, status, and actions. Click on any report to view its configuration or access related resources like pull requests.">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      size="small"
                      class="ml-2"
                      color="grey-darken-1"
                    >
                      mdi-information-outline
                    </v-icon>
                  </template>
                </v-tooltip>
              </h3>
              <p class="text-caption text-grey-darken-1 mb-0">
                Historical pipeline execution data with full details
              </p>
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
      val && setTimeout(() => {
        this.isLoading = false
      }, 10000)
    },
    filter: function() {
      // IF the filter is changed, we need to wait for the summary and reports to be updated
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
    updateFilter: function(filter) {
      this.filter = filter;
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
