<template>
  <v-container class="page-shell">
    <v-overlay
      :model-value="isLoading"
      class="align-center justify-center"
      :disabled=false
      :eager=true
      :no-click-animation=false
      :persistent=false
      :opacity="0"
      >
      <v-progress-circular
        color="black"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>
    <PageTitle
      title="Git Dashboard"
      icon="mdi-view-dashboard"
    />
    <v-row>
      <v-col
        cols="auto"
        lg="12"
        md="12"
        sm="12"
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
        cols="auto"
        lg="12"
        md="12"
        sm="12"
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
        icon: "mdi-view-dashboard",
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

